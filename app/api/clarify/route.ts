// app/api/clarify/route.ts
//
// Generate 3-5 clarifying questions for the user's prompt.
//
// POST /api/clarify
// Body:    { prompt: string, docType: DocType }
// Returns: ClarifyResponse  ({ questions: string[] })
//
// Simpler than analyze-prompt — no rubric, no scoring. Just calls the AI
// with a doc-type-specific clarifier prompt and returns the question list.

import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { getClarifyPrompt } from "@/lib/prompts";
import { isDocTypeEnabled } from "@/lib/doc-types";
import type { ClarifyResponse, DocType } from "@/lib/types";

export async function POST(request: Request) {
  try {
    // 1. Parse and validate.
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const docType = body.docType as DocType;

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

    // 2. Look up the system prompt for this doc type.
    const systemPrompt = getClarifyPrompt(docType);

    // 3. Build the user message — just the prompt.
    const userMessage = `User's prompt:\n\n"""\n${prompt}\n"""`;

    // 4. Call OpenAI in JSON mode.
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4, // Slightly more variety in question phrasing
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: "AI returned an empty response." },
        { status: 502 }
      );
    }

    // 5. Parse and validate JSON.
    let parsed: { questions?: unknown };
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    const questions = Array.isArray(parsed.questions)
      ? parsed.questions.filter((q): q is string => typeof q === "string")
      : [];

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "AI did not return any questions." },
        { status: 502 }
      );
    }

    // 6. Return the response.
    const response: ClarifyResponse = { questions };
    return NextResponse.json(response);
  } catch (err) {
    console.error("/api/clarify error:", err);
    return NextResponse.json(
      { error: "Something went wrong generating clarifying questions." },
      { status: 500 }
    );
  }
}
