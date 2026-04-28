// lib/rubrics/prompt/prd.ts
//
// Layer 1: PRD-specific prompt rubric add-ons.
//
// These rules are merged on top of the universal prompt rules
// (in lib/rubrics/prompt/universal.ts) when the user has selected
// "prd" as their document type.
//
// Why doc-type add-ons exist: a PRD prompt should hint at users,
// goals, and scope — concerns specific to product writing that
// don't apply to, say, meeting notes prompts.

/**
 * Three extra rules layered on top of the universal rules
 * when generating a PRD.
 */
export const PRD_PROMPT_RULES: string[] = [
  "Hints at a problem being solved (not just a feature description)",
  "Mentions success criteria, metrics, or what 'good' looks like",
  "Indicates scope or boundaries (what's in vs out)",
];
