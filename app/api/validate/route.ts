// app/api/validate/route.ts
//
// Layer 2 v2: Document Quality Validator with THREE signals.
//
// POST /api/validate
// Body: {
//   document: string,                          // The generated PRD
//   assumptions: Assumption[],                 // From /api/generate
//   docType: DocType,
//   prompt: string,                            // Original user prompt (for grounding audit)
//   answers: { question: string, answer: string }[]  // Clarifying Q&A (for grounding audit)
// }
// Returns: ValidateResponse  ({ rules, ungroundedClaims, score, recommendation })
//
// Flow:
//   1. Validate body
//   2. Call OpenAI for rule validation (existing prompt)
//   3. Call OpenAI for grounding audit (NEW — independent auditor)
//   4. Compute score deterministically with all three signals
//   5. Return everything

import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { getDocumentRubric } from "@/lib/rubrics/document";
import { getValidatePrompt, getAuditGroundingPrompt } from "@/lib/prompts";
import { computeDocumentScore } from "@/lib/score";
import { isDocTypeEnabled } from "@/lib/doc-types";
import type {
  Assumption,
  DocType,
  RuleResult,
  UngroundedClaim,
  ValidateResponse,
} from "@/lib/types";

interface AIValidateResult {
  rules: RuleResult[];
}

interface AIGroundingResult {
  ungroundedClaims: UngroundedClaim[];
}

interface QAPair {
  question: string;
  answer: string;
}

/**
 * Defensive cleanup of assumptions array from the request body.
 */
function sanitizeAssumptions(raw: unknown): Assumption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (a): a is { text: unknown; risk: unknown } =>
        typeof a === "object" && a !== null
    )
    .map((a) => {
      const text = typeof a.text === "string" ? a.text : "";
      const risk = a.risk === "risky" ? "risky" : "reasonable";
      return { text, risk } as Assumption;
    })
    .filter((a) => a.text.length > 0);
}

/**
 * Defensive cleanup of answers array from the request body.
 */
function sanitizeAnswers(raw: unknown): QAPair[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (a): a is QAPair =>
      typeof a === "object" &&
      a !== null &&
      typeof (a as QAPair).question === "string" &&
      typeof (a as QAPair).answer === "string"
  );
}

/**
 * Defensive cleanup of ungrounded claims from the AI response.
 */
function sanitizeUngroundedClaims(raw: unknown): UngroundedClaim[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (c): c is { claim: unknown; section: unknown } =>
        typeof c === "object" && c !== null
    )
    .map((c) => ({
      claim: typeof c.claim === "string" ? c.claim : "",
      section: typeof c.section === "string" ? c.section : "",
    }))
    .filter((c) => c.claim.length > 0);
}

export async function POST(request: Request) {
  try {
    // 1. Parse and validate the request body.
    const body = await request.json();
    const document =
      typeof body.document === "string" ? body.document.trim() : "";
    const docType = body.docType as DocType;
    const assumptions = sanitizeAssumptions(body.assumptions);
    const userPrompt =
      typeof body.prompt === "string" ? body.prompt.trim() : "";
    const answers = sanitizeAnswers(body.answers);

    if (!document) {
      return NextResponse.json(
        { error: "Document is required and cannot be empty." },
        { status: 400 }
      );
    }

    if (!isDocTypeEnabled(docType)) {
      return NextResponse.json(
        { error: `Document type '${docType}' is not supported in the MVP.` },
        { status: 400 }
      );
    }

    if (!userPrompt) {
      return NextResponse.json(
        { error: "Original prompt is required for grounding audit." },
        { status: 400 }
      );
    }

    // 2. Look up rubric and prompts for this doc type.
    const rubric = getDocumentRubric(docType);
    const validateSystemPrompt = getValidatePrompt(docType);
    const groundingSystemPrompt = getAuditGroundingPrompt(docType);

    if (rubric.length === 0 || !validateSystemPrompt || !groundingSystemPrompt) {
      return NextResponse.json(
        {
          error: `Validation rubric or prompts not defined for '${docType}'.`,
        },
        { status: 400 }
      );
    }

    // 3. Build the user messages.
    const validateUserMessage = `Document to evaluate:\n\n"""\n${document}\n"""\n\nRubric (evaluate each rule, in this order):\n${rubric
      .map((r, i) => `${i + 1}. ${r}`)
      .join("\n")}`;

    const answersBlock =
      answers.length > 0
        ? answers
            .map(
              ({ question, answer }, i) =>
                `${i + 1}. Q: ${question}\n   A: ${answer.trim() || "(skipped)"}`
            )
            .join("\n")
        : "(no clarifying answers provided)";

    const groundingUserMessage = `User's original prompt:\n\n"""\n${userPrompt}\n"""\n\nClarifying Q&A:\n${answersBlock}\n\nGenerated document to audit for grounding:\n\n"""\n${document}\n"""`;

    // 4. Run BOTH AI calls in parallel — they don't depend on each other.
    const [validateCompletion, groundingCompletion] = await Promise.all([
      openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: validateSystemPrompt },
          { role: "user", content: validateUserMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
      openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: groundingSystemPrompt },
          { role: "user", content: groundingUserMessage },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    ]);

    // 5. Parse and validate the rule check response.
    const validateRaw = validateCompletion.choices[0]?.message?.content;
    if (!validateRaw) {
      return NextResponse.json(
        { error: "AI returned an empty rule-check response." },
        { status: 502 }
      );
    }

    let validateResult: AIValidateResult;
    try {
      validateResult = JSON.parse(validateRaw);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON for rule check." },
        { status: 502 }
      );
    }
    const rules = Array.isArray(validateResult.rules) ? validateResult.rules : [];

    // 6. Parse and validate the grounding audit response.
    const groundingRaw = groundingCompletion.choices[0]?.message?.content;
    if (!groundingRaw) {
      return NextResponse.json(
        { error: "AI returned an empty grounding response." },
        { status: 502 }
      );
    }

    let groundingResult: AIGroundingResult;
    try {
      groundingResult = JSON.parse(groundingRaw);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON for grounding audit." },
        { status: 502 }
      );
    }
    const ungroundedClaims = sanitizeUngroundedClaims(
      groundingResult.ungroundedClaims
    );

    // 7. Compute the score deterministically with all three signals.
    const { score, recommendation } = computeDocumentScore(
      rules,
      assumptions,
      ungroundedClaims
    );

    // 8. Return the full response.
    const response: ValidateResponse = {
      rules,
      ungroundedClaims,
      score,
      recommendation,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("/api/validate error:", err);
    return NextResponse.json(
      { error: "Something went wrong validating the document." },
      { status: 500 }
    );
  }
}
