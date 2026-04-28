# spec.md — AI Document Trust & Review Layer

> Spec-driven hackathon project (Devpost: Spec-Driven Development with Claude Code).
> A general-purpose document review system with TWO layers of trust:
> Layer 1 — Prompt Quality (input review)
> Layer 2 — Document Quality (output review)
> MVP ships with PRD support.
> This file is the technical blueprint and lives in docs/spec.md after reorganization.

---

## 1. Problem

AI-generated documents (PRDs, tech specs, meeting notes) are fast to create but slow to trust. Two failure modes drive this:

1. Bad input produces bad output. Vague or incomplete prompts produce shallow documents — no AI tool can recover from a 2-line prompt.
2. Hidden assumptions in output. Even with good input, generated documents make implicit assumptions that reviewers can't easily spot.

The Trust Layer addresses both: coaching the user toward better prompts, then validating what was produced.

## 2. Solution (One Sentence)

A general-purpose web app that adds two trust layers around AI document creation: a prompt quality review before generation, and a document quality review after — each producing a deterministic 0-100 score so users know exactly where verification effort is needed.

## 3. The Two Trust Layers

### Layer 1 — Prompt Quality (Pre-Generation)

Analyzes the user's input prompt against:
- Universal prompt rubric — base rules (specificity, scope clarity, target audience, success criteria mentioned)
- Doc-type-specific add-ons — extra rules per doc type (e.g., PRD-bound prompts should hint at users and goals)

Produces:
- A prompt trust score (0-100)
- Specific feedback on what's vague or missing
- Suggested improvements

User behavior: soft mode. Feedback is shown but the user can choose to proceed without addressing it.

### Layer 2 — Document Quality (Post-Generation)

Analyzes the generated document against:
- Doc-type-specific rubric (e.g., PRD rubric — 10 rules)
- Assumptions the AI flagged (with risky/reasonable tags)

Produces:
- A document trust score (0-100)
- Pass/fail per rule with evidence
- Assumptions list

## 4. Architecture Philosophy

Plug-in everything per document type. The pipeline (input → analyze prompt → clarify → generate → validate document) is universal. What changes per doc type:

- The clarifying questions prompt
- The generation prompt template
- The document validation rubric
- The doc-type-specific prompt rubric add-ons

Adding a new document type means adding rubric files plus prompt files. No core changes.

## 5. Document Types

### Supported in MVP
- PRD (Product Requirements Document) — fully implemented, default selected

### Architecturally Supported, Not Yet Implemented
- Technical Spec — stub rubrics + prompts
- Meeting Notes / Decision Doc — stub rubrics + prompts

UI must show all three types. Non-MVP types display a "Coming soon" badge and are disabled.

## 6. Out of Scope (MVP)

- User accounts / auth
- Persistence / database
- Tech Spec and Meeting Notes implementations
- Iterative prompt refinement loops (user analyzes once, then proceeds — no re-analyze cycle beyond a single edit pass)
- Forced prompt improvement (soft mode only)
- Team collaboration
- Export to Word/PDF
- Custom user-defined rubrics

## 7. In Scope (MVP)

A single-page Next.js app with six sequential steps:

1. Select — User picks a document type (PRD enabled, others disabled)
2. Input — User pastes a rough idea/prompt
3. Analyze — Show prompt trust score + feedback. User can edit and re-analyze, or proceed as-is.
4. Clarify — AI asks 3-5 doc-type-specific questions; user answers
5. Generate — AI produces the document; loading state
6. Review — Display BOTH trust scores side by side, plus document, assumptions, validation results

User can copy the document to clipboard and start over.

## 8. The Universal Trust Score Algorithm

Both layers use the SAME formula. Only the rubric differs.

Formula:
Trust Score = 100 - (8 points per failed rule) - (3 points per risky assumption, capped at -20)

(For Layer 1, "risky assumptions" doesn't apply — only the rule count contributes.)

Floor: score cannot go below 0.

Recommendation bands (universal):
- 80-100: "Light review — looks solid"
- 60-79: "Medium review — check the flagged sections"
- 40-59: "Heavy review — significant gaps"
- 0-39: "Rewrite recommended — too many issues"

For Layer 1 (Prompt Quality), the recommendations are reworded:
- 80-100: "Strong prompt — proceed with confidence"
- 60-79: "Decent prompt — consider addressing flagged items"
- 40-59: "Weak prompt — revising will improve output significantly"
- 0-39: "Very vague — rewrite recommended before generating"

## 9. Layer 1: Prompt Rubrics

### Universal Prompt Rubric (applies to all doc types)
1. Has a clear subject (what the document is about)
2. Specifies target audience or users
3. Mentions a goal, outcome, or purpose
4. Provides any context or constraints
5. Has enough detail to act on (longer than ~20 words and not just a topic phrase)

### PRD-Specific Prompt Add-Ons
6. Hints at a problem being solved (not just a feature description)
7. Mentions success criteria, metrics, or what "good" looks like
8. Indicates scope or boundaries (what's in vs out)

### Tech Spec Prompt Add-Ons (stub for future)
Will check for: technical context, system constraints, performance requirements

### Meeting Notes Prompt Add-Ons (stub for future)
Will check for: meeting context, attendees, agenda topics

## 10. Layer 2: Document Rubrics

### PRD Document Rubric (10 rules, MVP)

1. Has a clear problem statement
2. Defines target users
3. Lists user stories or use cases
4. Specifies success metrics (quantifiable)
5. Calls out edge cases or failure modes
6. States non-goals / out-of-scope items
7. Identifies dependencies or risks
8. Has acceptance criteria
9. Mentions a timeline or milestones
10. Notes open questions

### Tech Spec Document Rubric (stub)
Future rules: API contracts, data model, error handling, scalability, security, observability, dependencies, rollout plan, testing strategy, open technical questions.

### Meeting Notes Document Rubric (stub)
Future rules: attendees listed, date/time, agenda addressed, decisions explicit, action items have owners, deadlines, blockers, follow-up, dissents, next meeting.

## 11. Architecture

Next.js 14 App (App Router)
- Client (React, Tailwind UI, React state)
- API routes:
  - /api/analyze-prompt (Layer 1)
  - /api/clarify
  - /api/generate
  - /api/validate (Layer 2)
- OpenAI SDK calls GPT-4o (or gpt-4o-mini for cost savings during development)

All API routes accept a docType parameter. Route handlers look up the appropriate rubric/prompt by docType.

No database. State lives in React for the session.

## 12. API Contracts

### POST /api/analyze-prompt
Request: { prompt: string, docType: string }
Response: {
  rules: [{ name: string, passed: boolean, evidence: string }],
  score: number,
  recommendation: string,
  suggestions: string[]
}

### POST /api/clarify
Request: { prompt: string, docType: string }
Response: { questions: string[] }

### POST /api/generate
Request: { prompt: string, answers: { question: string, answer: string }[], docType: string }
Response: {
  document: string (markdown),
  assumptions: [{ text: string, risk: "risky" | "reasonable" }]
}

### POST /api/validate
Request: { document: string, assumptions: Assumption[], docType: string }
Response: {
  rules: [{ name: string, passed: boolean, evidence: string }],
  score: number,
  recommendation: string
}

Both /api/analyze-prompt and /api/validate compute scores deterministically server-side, not by the AI. Critical for trust.

## 13. UI Spec

Single page, six states managed by a step variable: select | input | analyze | clarify | generate | review.

Layout: centered column, max-width 768px. Tailwind. Dark mode default.

Step 1 — Select Document Type:
- Heading: "What kind of document?"
- Three cards: PRD (enabled, default), Tech Spec (disabled, "Coming soon"), Meeting Notes (disabled, "Coming soon")
- Button: "Continue"

Step 2 — Input:
- Heading: "Describe what you want to build" (PRD-specific)
- Textarea (rows=6) with doc-type placeholder
- Button: "Analyze prompt"

Step 3 — Analyze:
- Heading: "How's your prompt?"
- Prompt trust score badge (color-coded)
- Feedback section: list of issues/suggestions
- Original prompt shown in editable textarea (user can edit and click "Re-analyze")
- Two buttons:
  - "Edit and re-analyze" (re-runs /api/analyze-prompt)
  - "Continue anyway" (proceeds to clarify)

Step 4 — Clarify:
- Heading: "A few things to nail down"
- Each question + answer textarea + "Skip" link
- Button: "Generate document"

Step 5 — Generate: Loading. "Drafting your document..." Auto-advances.

Step 6 — Review:
- Top section — TWO TRUST SCORES side by side:
  - Prompt Trust Score (with mini-recommendation)
  - Document Trust Score (with mini-recommendation)
  - Both color-coded
- Document type label
- Middle: Rendered document (react-markdown)
- Bottom (collapsible):
  - Prompt feedback details (rules from Layer 1)
  - Assumptions (with risk badges)
  - Document validation results (rules from Layer 2 with evidence)
- Buttons: "Copy document" and "Start over"

## 14. File Structure

trust-layer/
├── docs/
│   ├── scope.md
│   ├── prd.md
│   ├── spec.md           (this file)
│   ├── checklist.md
│   └── reflection.md     (written at end)
├── CLAUDE.md
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.ts
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
│       ├── analyze-prompt/route.ts
│       ├── clarify/route.ts
│       ├── generate/route.ts
│       └── validate/route.ts
└── lib/
    ├── openai.ts                 (OpenAI SDK client)
    ├── score.ts                  (universal score calculator)
    ├── types.ts                  (shared TS types)
    ├── doc-types.ts              (registry)
    ├── rubrics/
    │   ├── prompt/
    │   │   ├── index.ts          (lookup, merges universal + add-ons)
    │   │   ├── universal.ts      (base rules — implemented)
    │   │   ├── prd.ts            (PRD add-ons — implemented)
    │   │   ├── tech-spec.ts      (stub)
    │   │   └── meeting-notes.ts  (stub)
    │   └── document/
    │       ├── index.ts          (lookup by docType)
    │       ├── prd.ts            (PRD rubric — implemented)
    │       ├── tech-spec.ts      (stub)
    │       └── meeting-notes.ts  (stub)
    └── prompts/
        ├── index.ts              (lookup by docType)
        ├── prd.ts                (clarify + generate prompts — implemented)
        ├── tech-spec.ts          (stub)
        └── meeting-notes.ts      (stub)

## 15. Environment Variables

OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

## 16. Acceptance Criteria

The MVP is done when:
- User can select PRD, paste a prompt, see a prompt trust score, proceed (or edit), answer clarifying questions, and reach the review screen
- All four AI API calls happen in sequence without errors on the happy path
- BOTH trust scores render on the review screen, color-coded, with recommendations
- Prompt rule results visible (collapsible)
- Document rule results visible with evidence
- Assumptions listed with risk badges
- "Copy document" button works
- "Edit and re-analyze" works (re-runs prompt analysis)
- Tech Spec and Meeting Notes appear in selector but are disabled
- App is deployed to Vercel with a public URL
- README links to deployed URL with setup instructions
- docs/ folder contains all required submission artifacts

## 17. Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI SDK (openai npm package)
- react-markdown
- Deployed to Vercel

## 18. Demo Story

Most AI document tools generate fast and leave you to verify slowly. We added two trust layers — one before you generate, one after.

Before generation, we score your prompt: is it specific enough? Does it mention users and goals? We give you feedback BEFORE you waste a generation cycle.

After generation, we score the document against a rubric AND flag every assumption the AI made.

You see two scores: how good was your input, how good is the output. The architecture is general-purpose — today PRDs, soon tech specs and meeting notes. To add a new doc type, write rubric files. The trust pipeline is universal.

## 19. v2 Backlog (NOT in MVP)

- Iterative prompt refinement (loop until score >= threshold)
- Implement Tech Spec doc type fully
- Implement Meeting Notes doc type fully
- Persistence (save sessions)
- Custom user-defined rubrics
- Export to Word/PDF
- Side-by-side prompt diff (before/after edit)
- Streaming generation
- Authentication and saved history
