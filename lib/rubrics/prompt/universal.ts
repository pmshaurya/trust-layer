// lib/rubrics/prompt/universal.ts
//
// Layer 1: Universal Prompt Rubric.
//
// These rules apply to ANY document type. They check whether the user's
// prompt — the rough idea they typed in — has the basic ingredients of
// a workable input. Doc-type-specific add-ons (e.g., PRD-specific) live
// in sibling files and get merged on top of these rules at lookup time.
//
// Each rule is a one-line description that the AI will evaluate
// against the user's prompt and return passed/failed + evidence.

/**
 * The five universal rules every prompt is judged against.
 * Order doesn't affect scoring (each rule is worth the same), but the
 * order shown to users matches this list.
 */
export const UNIVERSAL_PROMPT_RULES: string[] = [
  "Has a clear subject (what the document is about)",
  "Specifies target audience or users",
  "Mentions a goal, outcome, or purpose",
  "Provides any context or constraints",
  "Has enough detail to act on (longer than a one-line topic phrase)",
];
