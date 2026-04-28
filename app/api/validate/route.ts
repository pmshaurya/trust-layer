// app/api/validate/route.ts
//
// Layer 2: Document Quality Validator.
//
// POST /api/validate
// Body: {
//   document: string,
//   assumptions: Assumption[],
//   docType: DocType
// }
// Returns: ValidateResponse  ({ rules, score, recommendation })
//
// Same structure as analyze-prompt, but:
//   - Uses the DOCUMENT rubric (not prompt rubric)
//   - Score factors in RISKY ASSUMPTIONS via computeDocumentScore

import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { getDocumentRubric } from "@/lib/rubrics/document";
import { getValidatePrompt } from "@/lib/prompts";
import { computeDocumentScore } from "@/lib/score";
import { isDocTypeEnabled } from "@/lib/doc-types";
import type {
  Assumption,
  DocType,
  RuleResult,
  ValidateResponse,
} from "@/lib/types";

/**
 * What we expect the AI to return — just rule results.
 * Score is computed server-side, not by the AI.
 */
interface AIValidateResult {
  rules: RuleResult[];
}

/**
 * Validate and clean the assumptions array passed from the client.
 * The /api/generate route already produced these; we trust the shape
 * but defensively filter malformed entries anyway.
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

export async function POST(request: Request) {
  try {
    // 1. Parse and validate the request body.
    const body = await request.json();
    const document =
      typeof body.document === "string" ? body.document.trim() : "";
    const docType = body.docType as DocType;
    const assumptions = sanitizeAssumptions(body.assumptions);

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

    // 2. Look up the document rubric and validate prompt.
    const rubric = getDocumentRubric(docType);
    const systemPrompt = getValidatePrompt(docType);

    if (rubric.length === 0) {
      return NextResponse.json(
        {
          error: `No document rubric defined for '${docType}'. This doc type is stubbed.`,
        },
        { status: 400 }
      );
    }

    // 3. Build the user message: the document + the rubric to check against.
    const userMessage = `Document to evaluate:\n\n"""\n${document}\n"""\n\nRubric (evaluate each rule, in this order):\n${rubric
      .map((r, i) => `${i + 1}. ${r}`)
      .join("\n")}`;

    // 4. Call OpenAI in JSON mode.
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // Low for consistent rule judgments
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: "AI returned an empty response." },
        { status: 502 }
      );
    }

    // 5. Parse the AI's JSON.
    let aiResult: AIValidateResult;
    try {
      aiResult = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    const rules = Array.isArray(aiResult.rules) ? aiResult.rules : [];

    // 6. Compute the score deterministically.
    // This factors in BOTH failed rules AND risky assumptions.
    const { score, recommendation } = computeDocumentScore(rules, assumptions);

    // 7. Return the full response.
    const response: ValidateResponse = {
      rules,
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
