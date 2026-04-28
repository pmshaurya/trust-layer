// lib/rubrics/document/index.ts
//
// Layer 2 document rubric lookup.
//
// Same pattern as lib/rubrics/prompt/index.ts but simpler — no universal
// rubric to merge. Each doc type has its own standalone rule list.

import type { DocType } from "../../types";
import { PRD_DOCUMENT_RULES } from "./prd";
import { TECH_SPEC_DOCUMENT_RULES } from "./tech-spec";
import { MEETING_NOTES_DOCUMENT_RULES } from "./meeting-notes";

/**
 * Doc type to document-validation rule list.
 *
 * Record<DocType, string[]> ensures every DocType has an entry — adding
 * a new DocType in lib/types.ts will trigger a TypeScript error here
 * until you add a matching entry.
 */
const DOCUMENT_RULES: Record<DocType, string[]> = {
  "prd": PRD_DOCUMENT_RULES,
  "tech-spec": TECH_SPEC_DOCUMENT_RULES,
  "meeting-notes": MEETING_NOTES_DOCUMENT_RULES,
};

/**
 * Get the Layer 2 document rubric for a given doc type.
 *
 * Returns the rules in display order. For PRD this is 10 rules.
 * For stubbed types this returns an empty array (caller should handle that).
 */
export function getDocumentRubric(docType: DocType): string[] {
  return DOCUMENT_RULES[docType];
}
