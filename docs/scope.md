# Scope — AI Document Trust & Review Layer

## Project Name
**Trust Layer** — an AI Document Trust & Review system

## One-Line Summary
A web app that adds two layers of trust around AI-generated documents: scoring the prompt before generation, and validating the output after — so users know exactly how much to verify.

## The Problem

AI tools generate documents (PRDs, tech specs, meeting notes, reports) in seconds. But reviewing them takes much longer because:

- Hidden assumptions are baked into outputs without being flagged
- Required sections are sometimes missing or shallow
- Quality varies unpredictably between generations
- Users have no signal for how much to trust the output

The result: AI shifts effort from creation to verification, eroding the productivity gain it was supposed to deliver.

There is also a less-discussed root cause: **bad inputs lead to bad outputs**. A vague 2-line prompt cannot produce a thorough document, no matter how capable the AI. Most tools don't help users notice their inputs are weak.

## The User

Primary users are people who use AI to create structured documents:

- **Product Managers** writing PRDs and roadmaps
- **Engineers** drafting technical specs
- **Founders** producing pitch documents
- **Students and learners** using AI for assignments and projects

What they share: they need to TRUST what AI produces enough to use it, but cannot afford to verify every line manually.

## What We're Building (High-Level)

A single-page web app with a six-step flow:

1. **Select** a document type (PRD for MVP; Tech Spec and Meeting Notes coming soon)
2. **Input** a rough idea or prompt
3. **Analyze** the prompt — the system scores it and suggests improvements
4. **Clarify** — the AI asks targeted questions to fill gaps
5. **Generate** the document
6. **Review** with two trust scores side-by-side: one for the prompt quality, one for the document quality

The user copies the document if satisfied, or starts over.

## Why This, Why Now

AI document generation is mainstream — millions use ChatGPT, Claude, and similar tools daily for work documents. The next wave of AI tooling won't be about generating faster, but about **trusting outputs better**. Tools that close the trust gap will become indispensable.

Most existing tools focus on improving generation quality (better prompts, better models). Few focus on **giving users a signal of trust** they can act on. The Trust Layer fills that gap.

## What Success Looks Like (MVP)

The MVP is successful when:

- A user with a vague PRD idea can paste it, see prompt-quality feedback, refine, generate a PRD, and get a document quality score — end-to-end, without errors
- Both trust scores are deterministic (rule-based, not AI-judged) so users can rely on them
- The system is general-purpose by design: adding a new document type means adding rubric files, not changing core code
- The app is publicly deployed and usable

## Out of Scope (MVP)

The following are deliberately excluded from the MVP. Listed here so they're not surprises later:

- User accounts, login, persistence
- Tech Spec and Meeting Notes (architecturally supported, but only PRD is implemented)
- Iterative prompt-refinement loops (one analyze + edit pass only)
- Forced prompt-quality gating (user can always proceed with a weak prompt)
- Export to Word/PDF (copy-paste only)
- Team features, collaboration, sharing
- Custom user-defined rubrics

## Differentiation

Three things make this different from other AI document tools:

1. **Two-layer trust**, not one. Most tools only review outputs. We coach inputs too.
2. **Deterministic scoring**. Scores come from rule-based math, not AI vibes. Users can audit how a score was computed.
3. **Document-type-agnostic architecture**. Adding new doc types is additive — write a rubric file, ship.

## Risks & Open Questions

- Will users care enough about prompt quality to act on Layer 1 feedback, or will they always just click "Continue anyway"? (We'll learn from usage.)
- Are 10 rules per rubric the right granularity, or should it be more/fewer? (Tunable.)
- Does the deterministic scoring feel "smart enough," or will users want AI judgment in the score itself? (Trade-off: smartness vs trust in the math.)

## Next Step

The detailed product requirements live in `docs/prd.md`, and the technical blueprint lives in `docs/spec.md`.
