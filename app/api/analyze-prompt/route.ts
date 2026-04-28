// app/api/analyze-prompt/route.ts
//
// Layer 1: Prompt Quality Analyzer.
//
// POST /api/analyze-prompt
// Body:    { prompt: string, docType: DocType }
// Returns: PromptAnalysisResponse
//
// Flow:
//   1. Validate body
//   2. Look up the prompt rubric and system prompt for this docType
//   3. Ask OpenAI to evaluate the user's prompt against each rule
//   4. Compute the score deterministically (NOT by the AI)
//   5. Return rules + score + recommendation + suggestions

import { NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { getPromptRubric } from "@/lib/rubrics/prompt";
import { getAnalyzePrompt } from "@/lib/prompts";
import { computePromptScore } from "@/lib/score";
import { isDocTypeEnabled } from "@/lib/doc-types";
import type {
  DocType,
  PromptAnalysisResponse,
  RuleResult,
} from "@/lib/types";

/**
 * The shape we expect OpenAI to return.
 * Score is NOT included — we compute it ourselves.
 */
interface AIAnalyzeResult {
  rules: RuleResult[];
  suggestions: string[];
}

export async function POST(request: Request) {
  try {
    // 1. Parse and validate the request body.
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

    // 2. Look up the rubric and system prompt for this doc type.
    const rubric = getPromptRubric(docType);
    const systemPrompt = getAnalyzePrompt(docType);

    // 3. Build the user message: include the prompt + the rubric the AI must check against.
    const userMessage = `User's prompt:\n\n"""\n${prompt}\n"""\n\nRubric (evaluate each rule, in this order):\n${rubric
      .map((r, i) => `${i + 1}. ${r}`)
      .join("\n")}`;

    // 4. Call OpenAI. Force JSON output mode for reliability.
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // Lower = more consistent rule evaluation
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      return NextResponse.json(
        { error: "AI returned an empty response." },
        { status: 502 }
      );
    }

    // 5. Parse the AI's JSON. If it's malformed, fail clearly.
    let aiResult: AIAnalyzeResult;
    try {
      aiResult = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    // Defensive: ensure rules is an array. Suggestions defaults to [].
    const rules = Array.isArray(aiResult.rules) ? aiResult.rules : [];
    const suggestions = Array.isArray(aiResult.suggestions)
      ? aiResult.suggestions
      : [];

    // 6. Compute the score deterministically. This is the whole point of Layer 1.
    const { score, recommendation } = computePromptScore(rules);

    // 7. Return the full response shape from lib/types.ts.
    const response: PromptAnalysisResponse = {
      rules,
      suggestions,
      score,
      recommendation,
    };

    return NextResponse.json(response);
  } catch (err) {
    // Catch-all: log on the server, return a clean error to the client.
    console.error("/api/analyze-prompt error:", err);
    return NextResponse.json(
      { error: "Something went wrong analyzing your prompt." },
      { status: 500 }
    );
  }
}
