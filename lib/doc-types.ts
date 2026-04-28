// lib/doc-types.ts
//
// The single source of truth for which document types this system supports.
// The UI uses this to render selector cards. Lookup functions use this
// to validate incoming docType values.
//
// To add a new document type:
//   1. Add a new "DocType" string in lib/types.ts
//   2. Add an entry below
//   3. Create matching files in lib/rubrics/document/, lib/rubrics/prompt/, lib/prompts/

import type { DocTypeInfo } from "./types";

/**
 * All document types the system knows about.
 *
 * "enabled: false" means the type appears in the UI selector
 * but is shown with a "Coming soon" badge and cannot be picked.
 *
 * MVP: only PRD is enabled. Tech Spec and Meeting Notes are reserved
 * for post-MVP work — their rubrics and prompts are stubs.
 */
export const DOC_TYPES: DocTypeInfo[] = [
  {
    id: "prd",
    label: "PRD",
    description: "Product Requirements Document",
    enabled: true,
  },
  {
    id: "tech-spec",
    label: "Tech Spec",
    description: "Technical specification or architecture doc",
    enabled: false,
  },
  {
    id: "meeting-notes",
    label: "Meeting Notes",
    description: "Meeting minutes with decisions and action items",
    enabled: false,
  },
];

/**
 * Look up a doc type entry by its id.
 * Returns undefined if the id is unknown — callers should handle that.
 */
export function getDocTypeInfo(id: string): DocTypeInfo | undefined {
  return DOC_TYPES.find((dt) => dt.id === id);
}

/**
 * True if a doc type is enabled and ready for production use.
 * API routes use this to reject requests for stubbed doc types early.
 */
export function isDocTypeEnabled(id: string): boolean {
  return getDocTypeInfo(id)?.enabled ?? false;
}
