// lib/score.ts
//
// The trust score calculator. Pure functions only — no I/O, no async.
//
// IMPORTANT: This is the heart of the trust layer. Both Layer 1 (prompt)
// and Layer 2 (document) use deterministic scoring so users can audit
// the math. Do not let an AI compute scores; always use these functions.

import type { Assumption, RuleResult, ScoreOutcome, UngroundedClaim } from "./types";

// Tunable constants. If you change these, document why.
const POINTS_PER_FAILED_PROMPT_RULE = 8;
const POINTS_PER_FAILED_DOCUMENT_RULE = 4;        // Lower than prompt rules (was 8)
                                                   // because Layer 2 v2 has more signals
const POINTS_PER_RISKY_ASSUMPTION = 5;
const MAX_ASSUMPTION_PENALTY = 30;                 // Was 40; rebalanced for three signals
const POINTS_PER_UNGROUNDED_CLAIM = 3;
const MAX_GROUNDING_PENALTY = 40;

/**
 * Recommendation text for the DOCUMENT (Layer 2) score.
 */
function getDocumentRecommendation(score: number): string {
  if (score >= 80) return "Light review — looks solid";
  if (score >= 60) return "Medium review — check the flagged sections";
  if (score >= 40) return "Heavy review — significant gaps";
  return "Rewrite recommended — too many issues";
}

/**
 * Recommendation text for the PROMPT (Layer 1) score.
 */
function getPromptRecommendation(score: number): string {
  if (score >= 80) return "Strong prompt — proceed with confidence";
  if (score >= 60) return "Decent prompt — consider addressing flagged items";
  if (score >= 40) return "Weak prompt — revising will improve output significantly";
  return "Very vague — rewrite recommended before generating";
}

/**
 * Compute the Layer 1 (prompt quality) score.
 * Formula:
 *   score = 100 - (8 × failed rules)
 * Floor: 0.
 */
export function computePromptScore(rules: RuleResult[]): ScoreOutcome {
  const failedRules = rules.filter((r) => !r.passed).length;
  const rulePenalty = failedRules * POINTS_PER_FAILED_PROMPT_RULE;
  const score = Math.max(0, 100 - rulePenalty);

  return {
    score,
    recommendation: getPromptRecommendation(score),
  };
}

/**
 * Compute the Layer 2 (document quality) score with THREE signals:
 *
 *   score = 100
 *         - (4 × failed structure rules)
 *         - (5 × risky assumptions, capped at -30)
 *         - (3 × ungrounded claims, capped at -40)
 *
 * Floor: 0.
 *
 * Why three signals:
 *   - Structure: did the AI produce a complete-looking document?
 *   - Assumptions: what did the AI itself flag as guesses?
 *   - Grounding: what claims couldn't an independent auditor trace
 *     back to the user's input?
 *
 * The grounding signal is the most honest because the auditor has no
 * stake in the document's quality.
 */
export function computeDocumentScore(
  rules: RuleResult[],
  assumptions: Assumption[],
  ungroundedClaims: UngroundedClaim[]
): ScoreOutcome {
  const failedRules = rules.filter((r) => !r.passed).length;
  const riskyAssumptions = assumptions.filter((a) => a.risk === "risky").length;
  const ungroundedCount = ungroundedClaims.length;

  const rulePenalty = failedRules * POINTS_PER_FAILED_DOCUMENT_RULE;
  const assumptionPenalty = Math.min(
    riskyAssumptions * POINTS_PER_RISKY_ASSUMPTION,
    MAX_ASSUMPTION_PENALTY
  );
  const groundingPenalty = Math.min(
    ungroundedCount * POINTS_PER_UNGROUNDED_CLAIM,
    MAX_GROUNDING_PENALTY
  );

  const score = Math.max(
    0,
    100 - rulePenalty - assumptionPenalty - groundingPenalty
  );

  return {
    score,
    recommendation: getDocumentRecommendation(score),
  };
}
