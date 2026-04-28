// lib/rubrics/document/prd.ts
//
// Layer 2: PRD document rubric.
//
// The 10 rules used to evaluate a generated PRD. Each rule is judged by
// the AI (passed/failed + evidence), and the score is computed deterministically
// in lib/score.ts.
//
// Mirror of spec section 10 in docs/spec.md. If you change one, change the other.

/**
 * The ten PRD rules. Order matches the order they're shown to users
 * on the review screen.
 */
export const PRD_DOCUMENT_RULES: string[] = [
  "Has a clear problem statement",
  "Defines target users",
  "Lists user stories or use cases",
  "Specifies success metrics (quantifiable)",
  "Calls out edge cases or failure modes",
  "States non-goals or out-of-scope items",
  "Identifies dependencies or risks",
  "Has acceptance criteria",
  "Mentions a timeline or milestones",
  "Notes open questions",
];
