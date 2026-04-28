// app/api/generate/route.ts
//
// Generate the document + extract assumptions.
//
// POST /api/generate
// Body: {
//   prompt: string,
//   answers: { question: string, answer: string }[],
//   docType: DocType
// }
// Returns: GenerateResponse  ({ document: string, assumptions: Assumption[] })

import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { getGeneratePrompt } from "@/lib/prompts";
import { isDocTypeEnabled } from "@/lib/doc-types";
import type {
  Assumption,
  DocType,
  GenerateResponse,
} from "@/lib/types";

/**
 * Single question/answer pair from the Clarify step.
 * Empty answer means the user clicked "Skip".
 */
interface QAPair {
  question: string;
  answer: string;
}

/**
 * Format the original prompt + Q&A pairs into a single user message
 * for the AI to consume.
 */
function buildUserMessage(prompt: string, answers: QAPair[]): string {
  const lines: string[] = [];
  lines.push(`User's original prompt:\n\n"""\n${prompt}\n"""`);

  if (answers.length > 0) {
    lines.push("\nClarifying Q&A:");
    answers.forEach(({ question, answer }, idx) => {
      const a = answer.trim() || "(skipped)";
      lines.push(`${idx + 1}. Q: ${question}\n   A: ${a}`);
    });
  }

  return lines.join("\n");
}

/**
 * Validate and clean the assumptions returned by the AI.
 * Drops malformed entries silently.
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
    // 1. Parse and validate.
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const docType = body.docType as DocType;
    const answers: QAPair[] = Array.isArray(body.answers)
      ? body.answers.filter(
          (a: unknown): a is QAPair =>
            typeof a === "object" &&
            a !== null &&
            typeof (a as QAPair).question === "string" &&
            typeof (a as QAPair).answer === "string"
        )
      : [];

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required and cannot be empty." },
        { status: 400 }
      );
    }

    if (!isDocTypeEnabled(docType)) {
      return NextResponse.json(
        { error: `Document type '${docType}' is not supported in the MVP.` },
        { status: 400 }
      );
    }

    // 2. Look up the system prompt.
    const systemPrompt = getGeneratePrompt(docType);

    // 3. Build the combined user message.
    const userMessage = buildUserMessage(prompt, answers);

    // 4. Call OpenAI in JSON mode.
    // Generation is the longest call — give the model room.
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: "AI returned an empty response." },
        { status: 502 }
      );
    }

    // 5. Parse the AI's JSON.
    let parsed: { document?: unknown; assumptions?: unknown };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    const document =
      typeof parsed.document === "string" ? parsed.document : "";
    const assumptions = sanitizeAssumptions(parsed.assumptions);

    if (!document) {
      return NextResponse.json(
        { error: "AI did not return a document." },
        { status: 502 }
      );
    }

    // 6. Return the response.
    const response: GenerateResponse = { document, assumptions };
    return NextResponse.json(response);
  } catch (err) {
    console.error("/api/generate error:", err);
    return NextResponse.json(
      { error: "Something went wrong generating the document." },
      { status: 500 }
    );
  }
}
