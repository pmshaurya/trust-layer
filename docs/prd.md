# PRD — Trust Layer

> Product Requirements Document for the AI Document Trust & Review Layer.
> Audience: anyone evaluating, designing, or building this product.
> The technical blueprint lives in docs/spec.md.

---

## 1. Problem Statement

People who use AI to generate work documents face a verification tax: AI produces documents quickly, but reviewers must spend disproportionate time figuring out what's real, what's assumed, and what's missing. The productivity gain from generation is partially eaten by the cost of verification.

Two specific failure modes drive the problem:

1. **Bad inputs cause bad outputs.** Vague prompts produce shallow documents. Users rarely notice their input was the weak link.
2. **Hidden assumptions in outputs.** AI fills gaps with plausible-sounding guesses. Reviewers can't easily see which parts are grounded vs invented.

The Trust Layer addresses both — coaching inputs and validating outputs — using deterministic, rule-based scoring users can trust.

## 2. Target Users

**Primary persona — Product Manager Priya.**
Priya writes 3-5 PRDs per quarter. She uses ChatGPT to draft them but spends 30+ minutes editing each because she's never sure what the AI made up. She wants AI to do the writing AND tell her what to double-check.

**Secondary personas:**
- **Engineer Eric** — drafts technical specs and architectural decision records using AI
- **Founder Farah** — produces pitch decks, market research summaries, hiring briefs
- **Student Sam** — uses AI for project proposals and assignments and worries about turning in low-quality work

What they share: trust is the bottleneck, not generation speed.

## 3. User Stories

The MVP must support these user stories:

**US-1: Pick a document type.**
As a user, I can choose which kind of document I'm creating (PRD, with Tech Spec and Meeting Notes shown as "coming soon"), so the system applies appropriate rules.

**US-2: Get pre-generation feedback on my prompt.**
As a user, I can paste a rough idea and immediately see how strong my prompt is — what's specific, what's vague, what's missing — before any document is generated.

**US-3: Refine my prompt and re-analyze.**
As a user, after seeing prompt feedback, I can edit my prompt and re-analyze it to see if my changes improved the score.

**US-4: Proceed with a weak prompt if I want.**
As a user, I am never forced to fix prompt issues. I can always choose to continue, accepting the trade-off.

**US-5: Answer clarifying questions.**
As a user, I receive 3-5 targeted questions specific to my document type and can answer or skip each.

**US-6: Read the generated document.**
As a user, I can view the document in clean rendered markdown, side-by-side with assumptions the AI flagged.

**US-7: See how trustworthy the output is.**
As a user, I see two trust scores: one for my prompt, one for the generated document. Each has a one-line recommendation telling me how much review is needed.

**US-8: Audit the score.**
As a user, I can expand a section to see exactly which rules passed, which failed, and the evidence the system used for each judgment.

**US-9: Copy the document.**
As a user, I can copy the rendered document to my clipboard with one click.

**US-10: Start over.**
As a user, I can restart the flow without refreshing the page.

## 4. Success Metrics (Quantifiable)

We'll measure success through:

- **Completion rate**: % of users who reach the review screen after starting. Target: ≥ 70%.
- **Prompt re-analysis rate**: % of users who edit and re-analyze at least once after seeing Layer 1 feedback. Target: ≥ 40%. (Indicates the feedback is useful.)
- **End-to-end latency**: time from "Generate" click to review screen rendered. Target: ≤ 30 seconds at p50.
- **Score consistency**: same prompt + same answers should produce score within ±5 points across runs (deterministic scoring helps; AI judgment introduces some variance).
- **Demo readiness**: a fresh visitor with no instructions can complete the flow in under 3 minutes.

## 5. Edge Cases & Failure Modes

The MVP must handle these gracefully:

- **Empty or whitespace-only prompt** → block with friendly error, do not call AI
- **Prompt under 10 characters** → score as very low (0-20), with feedback suggesting more detail
- **AI API timeout or 5xx** → retry once, then show an error state with "Try again" button (do not infinitely retry)
- **Malformed JSON from the AI** → log it, return a generic error, do not crash the page
- **User clicks "Skip" on every clarifying question** → proceed normally; assumptions list will likely be longer
- **User edits prompt mid-flow and goes back** → we DO NOT preserve answers across prompt changes; explain this in UI
- **Network disconnect mid-call** → show network error; allow retry
- **Browser refresh** → state is lost; user starts over (acceptable for MVP)
- **Very long prompts (over 5000 chars)** → accept but warn ("longer prompts may produce slower analysis")

## 6. Non-Goals (Out of Scope for MVP)

These are intentionally excluded:

- User authentication / accounts
- Persistence across sessions
- Tech Spec and Meeting Notes implementation (architecture supports them; rubrics/prompts are stubs)
- Iterative refinement loops (only one edit-and-re-analyze pass is provided)
- Mandatory prompt quality (soft mode only)
- Export to Word, PDF, Google Docs (clipboard only)
- Team features, comments, collaboration
- Custom user-defined rubrics
- Mobile-optimized UI (responsive enough to work on tablet, but desktop is the primary target)
- Real-time streaming of generated documents (full response, then render)

## 7. Dependencies & Risks

**Technical dependencies:**
- OpenAI API (GPT-4o or gpt-4o-mini) — single point of failure for all AI logic
- Vercel — hosting and deployment platform
- Next.js 14 — framework
- npm registry — for installing dependencies

**Risks:**

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| OpenAI returns malformed JSON | Medium | High (breaks scoring) | Strict prompt formatting + try/catch with fallback error state |
| AI calls are slow (>30s) | Medium | Medium (poor UX) | Loading states with copy that explains the wait |
| Score feels arbitrary to users | Medium | High (loss of trust) | Show evidence per rule, formula visible |
| API costs spike | Low | Low (MVP traffic) | Use gpt-4o-mini for non-critical calls |
| Vercel cold start delays | Low | Low | Hit the URL once before demoing |

## 8. Acceptance Criteria

The MVP is complete when ALL of the following are true:

- [ ] User can land on the homepage and pick "PRD" as document type
- [ ] User can paste a prompt and click "Analyze prompt"
- [ ] Layer 1 score and feedback render with rule-by-rule pass/fail visible
- [ ] User can edit the prompt and re-analyze (score updates)
- [ ] User can click "Continue anyway" with any score
- [ ] 3-5 clarifying questions appear; each has an answer textarea + skip link
- [ ] Clicking "Generate document" produces a markdown PRD within 30 seconds
- [ ] Review screen shows BOTH trust scores side-by-side, color-coded
- [ ] Document renders properly via react-markdown
- [ ] Assumptions section lists each assumption with risky/reasonable badge
- [ ] Validation results section lists each rule with check/cross + evidence
- [ ] "Copy document" button copies the markdown to clipboard
- [ ] "Start over" returns to step 1 with cleared state
- [ ] Tech Spec and Meeting Notes appear in selector but are visibly disabled
- [ ] Error states are handled gracefully (no white-screen crashes)
- [ ] App is publicly deployed at a Vercel URL
- [ ] README documents setup and links to live demo

## 9. Timeline & Milestones

This is a 2-3 day hackathon project. Working in evening sessions:

- **Day 1 (Day of writing this PRD)**: Planning artifacts complete (scope, prd, spec, checklist). Phase 0: scaffold Next.js app.
- **Day 2 morning**: Phase 1 — foundation files (types, score calculator, rubrics, prompts). Phase 2 — API routes start.
- **Day 2 evening**: Phase 2 finished. Phase 3 — UI for steps 1-3 (select, input, analyze).
- **Day 3 morning**: Phase 3 — UI for steps 4-6 (clarify, generate, review).
- **Day 3 afternoon**: Phase 4 — polish, error handling. Phase 5 — deploy to Vercel. Phase 6 — README, screenshots, Devpost submission.

If significantly behind schedule, the cut order is documented in `docs/checklist.md`.

## 10. Open Questions

Items deliberately left open for now:

- **Q1**: Should the prompt analysis be a full AI call or could the universal rules be regex-based for instant feedback? (Decision deferred to build phase — likely AI for now, simplify later.)
- **Q2**: How aggressive should the AI be in flagging assumptions as "risky"? Tuned by prompt engineering; will iterate based on output quality.
- **Q3**: For documents over a few thousand words, should we summarize the content in evidence quotes or include verbatim text? (Default: verbatim snippets for now.)
- **Q4**: Should the v2 backlog include a "compare two PRDs" mode (diff against an earlier version)? Idea recorded for future.
- **Q5**: Long-term, would users want to train custom rubrics on their team's docs? Out of MVP, but worth user research later.
