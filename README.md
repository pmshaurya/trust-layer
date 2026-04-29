# Trust Layer

> AI document review and prompt analyzer with two layers of trust.

**🌐 Live demo:** https://trust-layer-theta.vercel.app
**📐 Built with spec-driven development** — see [docs/](./docs)

---

## What it does

Most AI tools generate documents fast and leave you to verify them slowly. Trust Layer adds two trust layers around AI document creation:

- **Layer 1 — Prompt Quality (before generation):** Scores the user's prompt against a doc-type-specific rubric. Flags vagueness, surfaces missing context, suggests improvements — before a single token gets generated.
- **Layer 2 — Document Quality (after generation):** Three independent signals combined into a deterministic score.
  1. **Structure** — does the document have all required sections?
  2. **Grounding** — an independent AI auditor compares the document to your input and flags anything that wasn't traceable. This catches AI hallucinations the structure check misses.
  3. **Assumptions** — the AI's self-flagged risky guesses, each one penalizing the score.

You see two scores side by side: how good was your input, how trustworthy is the output. Every claim, every rule, every assumption is itemized — the math is auditable.

---

## Why this matters

A confident-sounding AI fills every section beautifully, even with information it invented. Existing tools score "did the AI fill in every section?" — Trust Layer scores "is each section actually grounded in what you asked for?"

The architecture is document-type agnostic. The MVP ships with PRD support; Tech Spec and Meeting Notes are stubbed via the same plug-in pattern. Adding a new doc type means one rubric file plus one prompts file — no core code changes.

---

## Tech stack

- Next.js 16 (App Router) with TypeScript
- Tailwind CSS v4 + Typography plugin
- OpenAI SDK (gpt-4o)
- react-markdown for document rendering
- Deployed on Vercel

---

## How it works

```
1. Select doc type (PRD)
2. Input rough prompt
3. Layer 1 — prompt analyzed, scored, suggestions shown
4. Clarifying questions generated; user answers or skips
5. Document generated with self-flagged assumptions
6. Layer 2 — document validated (structure + grounding audit + assumptions)
7. Review screen shows both scores + document + every flagged item
```

All four AI calls (analyze-prompt, clarify, generate, validate) use deterministic JSON output. Scores are computed server-side, never by the AI itself, so users can audit the math.

---

## Spec-driven development

This project was built using spec-driven development. Every line of code was preceded by a written specification. The full planning chain lives in [docs/](./docs):

- [scope.md](./docs/scope.md) — high-level scope (problem, users, why)
- [prd.md](./docs/prd.md) — product requirements
- [spec.md](./docs/spec.md) — technical blueprint
- [checklist.md](./docs/checklist.md) — phased build plan with verification steps
- [reflection.md](./docs/reflection.md) — what was learned, what to do differently

Even [CLAUDE.md](./CLAUDE.md) at the repo root is a spec — persistent context for the AI assistant that helped build the project.

---

## Local setup

```bash
git clone https://github.com/pmshaurya/trust-layer.git
cd trust-layer
npm install
echo "OPENAI_API_KEY=sk-..." > .env.local
echo "OPENAI_MODEL=gpt-4o" >> .env.local
npm run dev
```

Open http://localhost:3000.

---

## Built by

[Shaurya Suman](https://www.linkedin.com/in/shaurya-suman-552941a1/)

Built for [Devpost's Spec-Driven Development Learning Hackathon](https://learn-ai.devpost.com/).

---

## License

MIT
