// lib/score.ts
//
// The trust score calculator. Pure functions only — no I/O, no async.
//
// IMPORTANT: This is the heart of the trust layer. Both Layer 1 (prompt)
// and Layer 2 (document) use the SAME formula. The score must be
// deterministic so users can audit it. Do not let an AI compute scores;
// always use these functions.

import type { Assumption, RuleResult, ScoreOutcome } from "./types";

// Tunable constants. If you change these, document why.
const POINTS_PER_FAILED_RULE = 8;
const POINTS_PER_RISKY_ASSUMPTION = 3;
const MAX_ASSUMPTION_PENALTY = 20;

/**
 * Internal helper that runs the raw math.
 *
 * Given the set of rule results and (optionally) the assumptions,
 * applies the deterministic formula:
 *
 *     score = 100
 *           - (8 × failed rules)
 *           - (3 × risky assumptions, capped at -20)
 *
 * Floor: never below 0.
 */
function calculateScore(
  rules: RuleResult[],
  assumptions: Assumption[] = []
): number {
  const failedRules = rules.filter((r) => !r.passed).length;
  const riskyAssumptions = assumptions.filter((a) => a.risk === "risky").length;

  const rulePenalty = failedRules * POINTS_PER_FAILED_RULE;
  const rawAssumptionPenalty = riskyAssumptions * POINTS_PER_RISKY_ASSUMPTION;
  const assumptionPenalty = Math.min(rawAssumptionPenalty, MAX_ASSUMPTION_PENALTY);

  const score = 100 - rulePenalty - assumptionPenalty;

  // Floor at 0. (No need to cap at 100 because we're always subtracting.)
  return Math.max(0, score);
}

/**
 * Recommendation text for the DOCUMENT (Layer 2) score.
 * Based on the band the score falls into.
 */
function getDocumentRecommendation(score: number): string {
  if (score >= 80) return "Light review — looks solid";
  if (score >= 60) return "Medium review — check the flagged sections";
  if (score >= 40) return "Heavy review — significant gaps";
  return "Rewrite recommended — too many issues";
}

/**
 * Recommendation text for the PROMPT (Layer 1) score.
 * Worded differently because the user is being coached on their input,
 * not reviewing an output.
 */
function getPromptRecommendation(score: number): string {
  if (score >= 80) return "Strong prompt — proceed with confidence";
  if (score >= 60) return "Decent prompt — consider addressing flagged items";
  if (score >= 40) return "Weak prompt — revising will improve output significantly";
  return "Very vague — rewrite recommended before generating";
}

/**
 * Compute the Layer 1 (prompt quality) score.
 * No assumptions — Layer 1 only judges rules.
 */
export function computePromptScore(rules: RuleResult[]): ScoreOutcome {
  const score = calculateScore(rules, []);
  return {
    score,
    recommendation: getPromptRecommendation(score),
  };
}

/**
 * Compute the Layer 2 (document quality) score.
 * Includes assumption risk in the calculation.
 */
export function computeDocumentScore(
  rules: RuleResult[],
  assumptions: Assumption[]
): ScoreOutcome {
  const score = calculateScore(rules, assumptions);
  return {
    score,
    recommendation: getDocumentRecommendation(score),
  };
}
