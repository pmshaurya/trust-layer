// lib/prompts/index.ts
//
// Prompt lookup by doc type.
//
// Same pattern as lib/rubrics/prompt/index.ts and lib/rubrics/document/index.ts.
// API routes ask for a prompt by docType; this file does the lookup.

import type { DocType } from "../types";
import {
  PRD_ANALYZE_PROMPT,
  PRD_CLARIFY_PROMPT,
  PRD_GENERATE_PROMPT,
  PRD_VALIDATE_PROMPT,
  PRD_AUDIT_GROUNDING_PROMPT,
} from "./prd";
import {
  TECH_SPEC_ANALYZE_PROMPT,
  TECH_SPEC_CLARIFY_PROMPT,
  TECH_SPEC_GENERATE_PROMPT,
  TECH_SPEC_VALIDATE_PROMPT,
  TECH_SPEC_AUDIT_GROUNDING_PROMPT,
} from "./tech-spec";
import {
  MEETING_NOTES_ANALYZE_PROMPT,
  MEETING_NOTES_CLARIFY_PROMPT,
  MEETING_NOTES_GENERATE_PROMPT,
  MEETING_NOTES_VALIDATE_PROMPT,
  MEETING_NOTES_AUDIT_GROUNDING_PROMPT,
} from "./meeting-notes";

/**
 * One bundle of prompts per doc type.
 * If you add a new DocType in lib/types.ts, TypeScript will force you to
 * add a matching entry here — no silent fallback.
 */
const PROMPT_BUNDLES: Record<
  DocType,
  {
    analyze: string;
    clarify: string;
    generate: string;
    validate: string;
    auditGrounding: string;
  }
> = {
  "prd": {
    analyze: PRD_ANALYZE_PROMPT,
    clarify: PRD_CLARIFY_PROMPT,
    generate: PRD_GENERATE_PROMPT,
    validate: PRD_VALIDATE_PROMPT,
    auditGrounding: PRD_AUDIT_GROUNDING_PROMPT,
  },
  "tech-spec": {
    analyze: TECH_SPEC_ANALYZE_PROMPT,
    clarify: TECH_SPEC_CLARIFY_PROMPT,
    generate: TECH_SPEC_GENERATE_PROMPT,
    validate: TECH_SPEC_VALIDATE_PROMPT,
    auditGrounding: TECH_SPEC_AUDIT_GROUNDING_PROMPT,
  },
  "meeting-notes": {
    analyze: MEETING_NOTES_ANALYZE_PROMPT,
    clarify: MEETING_NOTES_CLARIFY_PROMPT,
    generate: MEETING_NOTES_GENERATE_PROMPT,
    validate: MEETING_NOTES_VALIDATE_PROMPT,
    auditGrounding: MEETING_NOTES_AUDIT_GROUNDING_PROMPT,
  },
};

/**
 * Layer 1: Prompt-quality analyzer system prompt.
 */
export function getAnalyzePrompt(docType: DocType): string {
  return PROMPT_BUNDLES[docType].analyze;
}

/**
 * Clarifying-questions system prompt for the given doc type.
 */
export function getClarifyPrompt(docType: DocType): string {
  return PROMPT_BUNDLES[docType].clarify;
}

/**
 * Document-generation system prompt for the given doc type.
 */
export function getGeneratePrompt(docType: DocType): string {
  return PROMPT_BUNDLES[docType].generate;
}

/**
 * Layer 2: Document-quality validator system prompt.
 */
export function getValidatePrompt(docType: DocType): string {
  return PROMPT_BUNDLES[docType].validate;
}

/**
 * Layer 2 v2: Grounding auditor system prompt for the given doc type.
 * Returns empty string for stubbed doc types.
 */
export function getAuditGroundingPrompt(docType: DocType): string {
  return PROMPT_BUNDLES[docType].auditGrounding;
}
