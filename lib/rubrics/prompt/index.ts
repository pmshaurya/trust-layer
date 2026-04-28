// lib/rubrics/prompt/index.ts
//
// Layer 1 prompt rubric lookup.
//
// This is the ONLY place in the codebase that maps a docType to its
// prompt rubric. API routes call getPromptRubric(docType) and never
// hardcode doc-type-specific logic themselves.

import type { DocType } from "../../types";
import { UNIVERSAL_PROMPT_RULES } from "./universal";
import { PRD_PROMPT_RULES } from "./prd";
import { TECH_SPEC_PROMPT_RULES } from "./tech-spec";
import { MEETING_NOTES_PROMPT_RULES } from "./meeting-notes";

/**
 * Doc-type-specific prompt rules that get layered on top of the universal rules.
 *
 * Using Record<DocType, string[]> means TypeScript will force a future
 * developer to add an entry here when adding a new DocType — no chance of
 * forgetting one and getting silent fallback behavior.
 */
const PROMPT_RULE_ADDONS: Record<DocType, string[]> = {
  "prd": PRD_PROMPT_RULES,
  "tech-spec": TECH_SPEC_PROMPT_RULES,
  "meeting-notes": MEETING_NOTES_PROMPT_RULES,
};

/**
 * Get the full Layer 1 prompt rubric for a given doc type.
 *
 * Returns the universal rules first, then the doc-type-specific add-ons.
 * The order matters because it's the order rules will be displayed to the user.
 *
 * Example:
 *   getPromptRubric("prd") -> 5 universal rules + 3 PRD add-on rules = 8 total
 *   getPromptRubric("tech-spec") -> 5 universal + 0 stub = 5 total (for now)
 */
export function getPromptRubric(docType: DocType): string[] {
  const addOns = PROMPT_RULE_ADDONS[docType];
  return [...UNIVERSAL_PROMPT_RULES, ...addOns];
}
