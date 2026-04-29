"use client";

// app/page.tsx
//
// The main UI for the Trust Layer.
// One single page, six conceptual steps controlled by a `step` state variable.
// Each step renders different content but they all live in this one file
// and share state via React useState.

import { useState } from "react";
import type {
  DocType,
  PromptAnalysisResponse,
  Assumption,
  GenerateResponse,
  ValidateResponse,
} from "@/lib/types";
import DocTypeSelector from "./components/DocTypeSelector";
import ScoreBadge from "./components/ScoreBadge";
import ReactMarkdown from "react-markdown";

// The six steps in our flow.
type Step = "select" | "input" | "analyze" | "clarify" | "generate" | "review";

export default function HomePage() {
  // ─── State ──────────────────────────────────────────────────────────
  // Which screen the user is currently on.
  const [step, setStep] = useState<Step>("select");

  // The doc type the user selected on Step 1.
  // We keep it as DocType | null so TypeScript reminds us it might be missing
  // before the user picks one.
  const [docType, setDocType] = useState<DocType | null>(null);

  // The user's raw prompt from Step 2.
  const [prompt, setPrompt] = useState<string>("");

  // Layer 1 result from /api/analyze-prompt (Step 3).
  const [promptAnalysis, setPromptAnalysis] =
    useState<PromptAnalysisResponse | null>(null);

  // Clarifying questions from /api/clarify (Step 4).
  const [questions, setQuestions] = useState<string[]>([]);

  // Map from question index -> user's answer text.
  // Empty string = skipped.
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Final generated document + assumptions (Step 5/6).
  const [generation, setGeneration] = useState<GenerateResponse | null>(null);

  // Layer 2 validation result (Step 6).
  const [documentLayer, setDocumentLayer] =
    useState<ValidateResponse | null>(null);

  // Loading and error UI state (used across all steps).
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Handlers ───────────────────────────────────────────────────────
  async function handleAnalyze() {
    if (!docType) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), docType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to analyze prompt");
      }
      const data: PromptAnalysisResponse = await res.json();
      setPromptAnalysis(data);
      setStep("analyze");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleClarify() {
    if (!docType) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), docType }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get clarifying questions");
      }
      const data: { questions: string[] } = await res.json();
      setQuestions(data.questions);
      setAnswers({});
      setStep("clarify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!docType) return;
    setError(null);
    setLoading(true);
    setStep("generate");
    try {
      // Build the answers payload — pair each question with the user's answer (or "").
      const answersPayload = questions.map((q, i) => ({
        question: q,
        answer: answers[i] ?? "",
      }));

      // Call /api/generate to produce the document + assumptions.
      const genRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          docType,
          answers: answersPayload,
        }),
      });
      if (!genRes.ok) {
        const data = await genRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate document");
      }
      const genData: GenerateResponse = await genRes.json();
      setGeneration(genData);

      // Then call /api/validate against the generated document.
      // v2 also sends the original prompt and answers so the grounding
      // auditor can compare them to the document.
      const valRes = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: genData.document,
          assumptions: genData.assumptions,
          docType,
          prompt: prompt.trim(),
          answers: answersPayload,
        }),
      });
      if (!valRes.ok) {
        const data = await valRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to validate document");
      }
      const valData: ValidateResponse = await valRes.json();
      setDocumentLayer(valData);

      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("clarify");
    } finally {
      setLoading(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold">Trust Layer</h1>
          <p className="text-zinc-400 mt-1">
            AI document review with two layers of trust.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-md border border-red-700 bg-red-950 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* Step content. Each branch renders the UI for that step. */}
        {step === "select" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">What kind of document?</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Pick the type of document you want to create. The system uses a
                doc-type-specific rubric to evaluate your prompt and the output.
              </p>
            </div>

            <DocTypeSelector
              selected={docType}
              onSelect={(id) => setDocType(id)}
            />

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!docType}
                onClick={() => setStep("input")}
                className="rounded-md bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200"
              >
                Continue
              </button>
            </div>
          </section>
        )}
        {step === "input" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">
                Describe what you want to build
              </h2>
              <p className="text-zinc-400 text-sm mt-1">
                A rough idea is fine — we'll analyze your prompt next and
                suggest improvements before generating anything.
              </p>
            </div>

            <textarea
              rows={6}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., I want to build a study app for university students preparing for software engineering interviews. Success means users practice 3 sessions per week."
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep("select");
                  setError(null);
                }}
                className="text-sm text-zinc-400 hover:text-zinc-200"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={loading || !prompt.trim() || !docType}
                onClick={handleAnalyze}
                className="rounded-md bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-200"
              >
                {loading ? "Analyzing..." : "Analyze prompt"}
              </button>
            </div>
          </section>
        )}
        {step === "analyze" && promptAnalysis && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">How's your prompt?</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Layer 1: a quick check on the input you gave us. You can
                edit and re-analyze, or proceed as-is.
              </p>
            </div>

            <div className="flex justify-center">
              <ScoreBadge
                score={promptAnalysis.score}
                label="Prompt Trust Score"
                recommendation={promptAnalysis.recommendation}
              />
            </div>

            {promptAnalysis.suggestions.length > 0 && (
              <div className="rounded-md border border-zinc-700 bg-zinc-900 p-4">
                <h3 className="text-sm font-semibold mb-2 text-zinc-200">
                  Suggested improvements
                </h3>
                <ul className="space-y-1 text-sm text-zinc-300 list-disc list-inside">
                  {promptAnalysis.suggestions.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            <details className="rounded-md border border-zinc-800 bg-zinc-900">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-200">
                Rule details ({promptAnalysis.rules.filter((r) => r.passed).length}/
                {promptAnalysis.rules.length} passed)
              </summary>
              <ul className="space-y-2 px-4 pb-4 text-sm">
                {promptAnalysis.rules.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={r.passed ? "text-emerald-400" : "text-red-400"}>
                      {r.passed ? "✓" : "✗"}
                    </span>
                    <span>
                      <span className="text-zinc-200">{r.name}</span>
                      <br />
                      <span className="text-zinc-500 text-xs">{r.evidence}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </details>

            <div>
              <label className="block text-sm font-semibold mb-2 text-zinc-200">
                Edit your prompt
              </label>
              <textarea
                rows={6}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 focus:border-zinc-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={loading}
                onClick={handleAnalyze}
                className="rounded-md border border-zinc-600 px-5 py-2 text-sm font-semibold text-zinc-200 disabled:opacity-40 hover:bg-zinc-900"
              >
                {loading ? "Re-analyzing..." : "Edit & re-analyze"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleClarify}
                className="rounded-md bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-40 hover:bg-zinc-200"
              >
                {loading ? "Loading..." : "Continue →"}
              </button>
            </div>
          </section>
        )}
        {step === "clarify" && (
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">A few things to nail down</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Answer what you can. Skip anything you're not sure about — the
                AI will flag those as risky assumptions.
              </p>
            </div>

            <ol className="space-y-5">
              {questions.map((q, i) => (
                <li key={i} className="space-y-2">
                  <div className="text-sm font-semibold text-zinc-200">
                    {i + 1}. {q}
                  </div>
                  <textarea
                    rows={3}
                    value={answers[i] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
                    }
                    placeholder="Your answer (or skip)..."
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"
                  />
                  {answers[i] && (
                    <button
                      type="button"
                      onClick={() =>
                        setAnswers((prev) => ({ ...prev, [i]: "" }))
                      }
                      className="text-xs text-zinc-500 hover:text-zinc-300"
                    >
                      Clear answer
                    </button>
                  )}
                </li>
              ))}
            </ol>

            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setStep("analyze");
                  setError(null);
                }}
                className="text-sm text-zinc-400 hover:text-zinc-200"
              >
                ← Back
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleGenerate}
                className="rounded-md bg-white px-5 py-2 text-sm font-semibold text-black disabled:opacity-40 hover:bg-zinc-200"
              >
                {loading ? "Generating..." : "Generate document →"}
              </button>
            </div>
          </section>
        )}
        {step === "generate" && (
          <section className="space-y-4 text-center py-20">
            <h2 className="text-xl font-semibold">Drafting your document...</h2>
            <p className="text-zinc-400 text-sm">
              Generating, then validating against the rubric. This usually
              takes 20-40 seconds.
            </p>
            <div className="flex justify-center pt-4">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full w-full animate-pulse bg-zinc-500" />
              </div>
            </div>
          </section>
        )}
        {step === "review" && generation && documentLayer && promptAnalysis && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-zinc-500 border border-zinc-700 rounded px-2 py-0.5">
                {docType?.toUpperCase()}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(generation.document);
                      setError(null);
                    } catch {
                      setError("Could not copy to clipboard");
                    }
                  }}
                  className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-900"
                >
                  Copy document
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("select");
                    setDocType(null);
                    setPrompt("");
                    setPromptAnalysis(null);
                    setQuestions([]);
                    setAnswers({});
                    setGeneration(null);
                    setDocumentLayer(null);
                    setError(null);
                  }}
                  className="rounded-md border border-zinc-600 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-900"
                >
                  Start over
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ScoreBadge
                score={promptAnalysis.score}
                label="Prompt Trust Score"
                recommendation={promptAnalysis.recommendation}
              />
              <ScoreBadge
                score={documentLayer.score}
                label="Document Trust Score"
                recommendation={documentLayer.recommendation}
              />
            </div>

            <article className="prose prose-invert prose-zinc max-w-none rounded-md border border-zinc-800 bg-zinc-900 px-6 py-5">
              <ReactMarkdown>{generation.document}</ReactMarkdown>
            </article>

            <details className="rounded-md border border-zinc-800 bg-zinc-900">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-200">
                Assumptions ({generation.assumptions.length})
              </summary>
              <ul className="space-y-2 px-4 pb-4 text-sm">
                {generation.assumptions.map((a, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span
                      className={`text-xs uppercase tracking-wide rounded px-2 py-0.5 border ${
                        a.risk === "risky"
                          ? "border-red-500 text-red-300 bg-red-950"
                          : "border-zinc-600 text-zinc-300 bg-zinc-800"
                      }`}
                    >
                      {a.risk}
                    </span>
                    <span className="text-zinc-200">{a.text}</span>
                  </li>
                ))}
                {generation.assumptions.length === 0 && (
                  <li className="text-zinc-500 italic">
                    No assumptions flagged.
                  </li>
                )}
              </ul>
            </details>

            <details
              className="rounded-md border border-zinc-800 bg-zinc-900"
              open={documentLayer.ungroundedClaims.length > 0}
            >
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-200">
                Ungrounded claims ({documentLayer.ungroundedClaims.length})
                {documentLayer.ungroundedClaims.length > 0 && (
                  <span className="ml-2 text-xs text-red-400 font-normal">
                    — invented by AI, not from your input
                  </span>
                )}
              </summary>
              <ul className="space-y-2 px-4 pb-4 text-sm">
                {documentLayer.ungroundedClaims.map((c, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="text-xs uppercase tracking-wide rounded px-2 py-0.5 border border-orange-500 text-orange-300 bg-orange-950">
                      {c.section}
                    </span>
                    <span className="text-zinc-200">{c.claim}</span>
                  </li>
                ))}
                {documentLayer.ungroundedClaims.length === 0 && (
                  <li className="text-zinc-500 italic">
                    No ungrounded claims found — every part of the document
                    traces to your input. (Rare!)
                  </li>
                )}
              </ul>
            </details>

            <details className="rounded-md border border-zinc-800 bg-zinc-900">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-200">
                Document validation ({documentLayer.rules.filter((r) => r.passed).length}/
                {documentLayer.rules.length} passed)
              </summary>
              <ul className="space-y-2 px-4 pb-4 text-sm">
                {documentLayer.rules.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={r.passed ? "text-emerald-400" : "text-red-400"}>
                      {r.passed ? "✓" : "✗"}
                    </span>
                    <span>
                      <span className="text-zinc-200">{r.name}</span>
                      <br />
                      <span className="text-zinc-500 text-xs">{r.evidence}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </details>

            <details className="rounded-md border border-zinc-800 bg-zinc-900">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-200">
                Prompt feedback ({promptAnalysis.rules.filter((r) => r.passed).length}/
                {promptAnalysis.rules.length} passed)
              </summary>
              <ul className="space-y-2 px-4 pb-4 text-sm">
                {promptAnalysis.rules.map((r, i) => (
                  <li key={i} className="flex gap-2">
                    <span className={r.passed ? "text-emerald-400" : "text-red-400"}>
                      {r.passed ? "✓" : "✗"}
                    </span>
                    <span>
                      <span className="text-zinc-200">{r.name}</span>
                      <br />
                      <span className="text-zinc-500 text-xs">{r.evidence}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </section>
        )}
      </div>
    </main>
  );
}
