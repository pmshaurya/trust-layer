# Reflection

A wrap-up of what was built, what was learned, and what would be done differently.

---

## What got built

A working web app — [trust-layer-theta.vercel.app](https://trust-layer-theta.vercel.app) — that wraps AI document creation with two trust layers:

- Layer 1 scores the user's prompt before generation
- Layer 2 scores the generated document with three independent signals: structure rules, grounding audit (independent AI auditor), and self-flagged assumptions

All four AI endpoints (`analyze-prompt`, `clarify`, `generate`, `validate`) use deterministic JSON output. Scores are computed server-side, never by the AI, so the math is auditable.

The architecture is document-type agnostic. PRD ships in the MVP; Tech Spec and Meeting Notes are stubbed in via the same plug-in pattern.

---

## The biggest lesson — using the product caught flaws specs missed

The most valuable moment of the entire build was *using my own product critically*. The spec, PRD, and original Layer 2 design all looked sound on paper. But after deploying a working flow and feeding it a deliberately vague prompt, I noticed the document was scoring 91-94 — way too high for an obviously thin output.

Sitting with that finding led to two architectural insights:

### Insight 1: rules check completeness, not fidelity
The 10-rule PRD rubric was asking *"did the AI write something here?"* — not *"is what it wrote actually grounded?"* Modern AI is so good at structurally complete output that the rules-pass-fail signal pinned at 10/10 for any reasonable prompt. The score was a vibe, not a measure.

### Insight 2: the AI shouldn't grade its own work
The original `/api/generate` route asked the AI to flag its own assumptions. That's like asking a cook to grade their own dish — the conflict of interest produced under-reported risks.

The fix in v2: an **independent grounding auditor** — a separate AI call whose only job is to compare the document to the user's actual input and flag specific claims that aren't traceable. The auditor has no stake in the document's quality, so it finds more problems than the author does. The score formula now factors structure (lower weight), assumptions, and ungrounded claims as three independent signals.

The same vague prompt that scored 91 in v1 scores 56 in v2 — with 8 specific ungrounded claims itemized. The score finally tells the user the truth.

---

## Process: what spec-driven dev actually felt like

I went in expecting "write a spec, then code from it." The reality was richer. The spec was alive throughout — I rewrote it three times during planning as the design got sharper, and once mid-build when I redesigned Layer 2.

What it gave me:
- Decisions stayed visible. I could see when a "small change" was actually a 3-hour scope expansion (and I still chose to do one of them — eyes open).
- Bugs were caught at design time, not code time. Three times during planning I noticed something didn't add up and fixed it in 5 minutes of conversation instead of after 2 hours of implementation.
- Documents like `CLAUDE.md` and `checklist.md` weren't busywork — they were the persistent context that made every later session start fast instead of slow.

The opposite was also true: I noticed how easy it is to *over-spec*. Several times I almost wrote elaborate sections about features that ended up cut. The spec is most useful when it's *just enough* to keep decisions visible.

---

## What I'd do differently next time

1. **Stress-test earlier.** I built four API routes before running a single end-to-end flow on a vague input. The Layer 2 v1 problem would have been visible from the very first end-to-end test if I'd run one before scaling up.

2. **Treat prompts as code, not as filler.** The system prompts in `lib/prompts/` are arguably the most important code in the project — they directly determine output quality. Next time I'd version them, write tests for them, and review them as carefully as production code from day one.

3. **Resist scope creep more aggressively.** I added the Layer 2 v2 redesign mid-build. It made the product genuinely better, but it nearly cost me submission time. A clearer rule: discoveries during build go into a v2 backlog by default; only the most critical changes land in the MVP.

4. **Write the README first, not last.** The README forces you to articulate what the project actually *is* in 30 seconds. Doing that earlier would have shaped sharper decisions throughout.

---

## Known limitations

- **Layer 2 rules still inflate.** The structure check almost always passes 10/10 because modern AI fills every section. The grounding audit catches the deeper problem, but the rules signal is mostly redundant. v3 would lean further into grounding and possibly drop the rule check entirely or fold it in.

- **The AI grades the AI.** Both layers ultimately rely on AI judgment for the rule and grounding evaluations. A non-AI structural validator (regex / parser) for the rules signal would make Layer 2 cheaper and more deterministic.

- **Scores depend on which AI grades them.** A late finding: after migrating from GPT-4o to Gemini for cost reasons, the same vague prompt that scored 56/100 on GPT-4o scored 26/100 on Gemini, with 8 ungrounded claims jumping to 36. The architecture is sound — different models simply have different "skepticism baselines." Gemini flags any unstated assertion; GPT-4o flags only the most egregious. Neither is wrong, but it means the absolute score isn't comparable across models. A v3 fix would either (a) calibrate prompts per-model with example-based few-shot tuning, (b) introduce a confidence threshold so only "high-confidence ungrounded" claims count, or (c) shift to relative scoring (this prompt vs. a perfect prompt of the same shape) instead of absolute.

- **Free-tier rate limits are a real constraint.** Gemini 2.5 flash-lite caps free usage at 20 requests/day on a new project. Trust Layer makes 4 AI calls per flow, so that's only ~5 full flows/day before the daily quota resets. A v3 path forward would be either (a) enabling paid billing — the cost is genuinely tiny (~$0.30 per million tokens), (b) implementing per-IP rate limiting in the app to stop bots before they consume quota, or (c) adding a graceful "rate limit exceeded — try again in N seconds" UI message so users know the issue isn't a bug. The lesson: free tiers are great for development, dangerous for shared demos.

- **Only PRD is implemented.** Tech Spec and Meeting Notes have stub rubrics and prompts. The architecture supports them; the content doesn't exist yet.

- **No persistence.** Refresh = start over. Acceptable for MVP, painful for real use.

---

## What's next (v2 backlog)

Captured during planning so they wouldn't be forgotten:

- Iterative prompt refinement (loop until prompt score ≥ threshold)
- Implement Tech Spec doc type fully
- Implement Meeting Notes doc type fully
- Persistence and saved sessions
- Custom user-defined rubrics
- Export to Word/PDF
- Streaming generation for faster perceived performance
- Authentication and saved history

---

## A note on tooling

This project was built using Claude Code as the coding assistant. Every file in this repo was reviewed before acceptance — "Ask before edits" stayed on for the entire session. Several real bugs (a missing `<` in a TypeScript generic, a broken `<a>` tag, a duplicate-paste detection) were caught by Claude Code flagging issues before applying changes. That review-first workflow turned out to be the single biggest contributor to *not* breaking the build.
