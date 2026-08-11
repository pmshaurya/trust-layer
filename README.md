# Trust Layer

**An AI document review system that catches hallucinated or unsupported claims — before and after generation.**

Trust Layer adds two independent verification layers around AI-generated documents. Instead of trusting a confident-sounding output, it scores the *input* for vagueness and missing context before generation, then scores the *output* for structural completeness, grounding (does every claim trace back to something the user actually said?), and self-flagged assumptions.

Built as a hands-on exploration of AI trust and governance — a problem every team shipping AI-generated content into enterprise workflows eventually runs into.

---

## Why this exists

AI-generated documents (PRDs, specs, meeting notes) read as authoritative even when they're partly fabricated. Most teams have no systematic way to catch this beyond a human skimming the output. Trust Layer is a working exploration of what a lightweight, auditable trust layer could look like: deterministic, server-side scoring rather than "trust the model's own confidence."

## How it works

1. **Pick a document type** (currently: PRD — Tech Spec and Meeting Notes are stubbed for future support).
2. **Layer 1 — Prompt validation.** Before anything is generated, the prompt is scored against a document-type-specific rubric and flagged for vagueness or missing context, with suggestions to improve it.
3. **Generate.** The document is produced, with any assumptions the model made explicitly flagged inline rather than buried.
4. **Layer 2 — Output validation.** The generated document is checked against three signals: structural completeness, grounding (do claims trace back to the user's actual inputs?), and flagged-assumption density.
5. **Review.** Both the prompt score and the document score are shown side by side with the full validation breakdown — nothing is a black-box number.

All scoring runs as deterministic, server-side JSON operations, so the math behind every score is inspectable rather than "the model said so."

## Tech stack

- **Framework:** Next.js 16 (App Router), TypeScript
- **Styling:** Tailwind CSS v4 + Typography plugin
- **AI:** OpenAI (GPT-4o), with Google Generative AI (Gemini) support
- **Rendering:** react-markdown
- **Deployment:** Vercel

## Demo status

This project was built for [Devpost's Spec-Driven Development Learning Hackathon](https://devpost.com/). The live Vercel deployment has since had its API keys deactivated to avoid ongoing inference costs — it's not currently live.

To see it in action without running it locally, [add a link to a screen recording or a few screenshots here].

To run it yourself, see **Getting Started** below.

## Getting started

```bash
git clone https://github.com/pmshaurya/trust-layer.git
cd trust-layer
npm install
```

Add your API key(s) to a `.env.local` file:

```
OPENAI_API_KEY=your_key_here
# optional, if using Gemini instead of / alongside OpenAI
GOOGLE_GENERATIVE_AI_API_KEY=your_key_here
```

Then run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
/app      — Next.js app router pages and API routes
/lib      — scoring logic, validation rubrics, prompt templates
/public   — static assets
/docs     — spec-driven development docs: scope, PRD, technical blueprint, build checklist, and process reflections
```

This project followed a spec-driven development approach — every feature was specified in `/docs` before any code was written. Worth a look if you're curious how the trust-scoring logic was designed, not just how it's implemented.

## Roadmap

- [ ] Tech Spec document type
- [ ] Meeting Notes document type
- [ ] Configurable rubrics per organization/team
- [ ] Historical scoring trends across a user's documents

## Background

Built by [Shaurya Suman](https://www.linkedin.com/in/shaurya-suman-552941a1/) — Senior Product Manager, exploring AI trust and governance hands-on rather than just from the product-requirements side.

## License

MIT
