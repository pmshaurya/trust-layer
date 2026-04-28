# CLAUDE.md — Project Context for Claude Code

You are helping build the AI Document Trust & Review Layer, a hackathon project for Devpost's "Spec-Driven Development with Claude Code" learning hackathon.

## Project Summary

A general-purpose Next.js web app that wraps document generation with three AI-powered features:
1. Clarifying questions before generation (reduce ambiguity)
2. Assumption extraction after generation (transparency)
3. Two deterministic trust scores (0-100): one for prompt quality, one for document quality

The system supports multiple document types via pluggable rubrics. The MVP ships with PRD support. Tech Spec and Meeting Notes are architecturally supported but not implemented.

## Submission Documents

Planning artifacts live in the docs/ folder. Read these whenever you need full context:
- docs/scope.md — high-level project scope (what + why)
- docs/prd.md — product requirements
- docs/spec.md — technical blueprint
- docs/checklist.md — step-by-step build plan
- docs/reflection.md — written at the end

The docs/ folder is the hackathon submission. Treat it as authoritative.

## Tech Stack

- Next.js 14 (App Router) with TypeScript
- Tailwind CSS for styling
- OpenAI SDK (the user has an OpenAI API key, not Anthropic)
- react-markdown for rendering generated documents
- Deployed to Vercel

## Architecture Rule (Critical)

This project uses a plug-in architecture for document types. Two folders define everything that's doc-type-specific:
- lib/rubrics/ — one file per doc type per layer (prompt rubric + document rubric)
- lib/prompts/ — one file per doc type for clarify/generate prompts

Core code (API routes, UI, score calculator) must be doc-type agnostic. Look up the rubric and prompts by docType at runtime.

Never hardcode doc-type-specific logic outside these two folders. If you find yourself writing if (docType === "prd") somewhere other than a lookup function, you're doing it wrong.

## Working Style

The user is new to JavaScript, TypeScript, and React. They are learning by reading code, not writing it. So:

1. Always explain before you build. When asked to create something, briefly explain (in 2-3 sentences) what you're about to do and why.
2. Comment generously. Add comments to non-obvious code so the user can learn from reading it.
3. One step at a time. Do exactly what is asked. Do not improve unrelated files or add unrequested features.
4. Confirm before installing. If a command needs to install a package or modify the system, ask first.
5. Prefer simple over fancy. Boring code is good code for learning.
6. Use plain language. Avoid jargon when explaining.

## Project Status

Following a phased build plan:
- Phase 1: Planning docs in docs/ (scope, prd, spec, checklist) — IN PROGRESS
- Phase 2: Scaffold Next.js project
- Phase 3: Foundation files (types, doc-type registry, score calculator, rubrics, prompts)
- Phase 4: API routes (analyze-prompt, clarify, generate, validate)
- Phase 5: UI (single-page app with 6 steps)
- Phase 6: Polish, error handling, copy-to-clipboard
- Phase 7: Deploy to Vercel
- Phase 8: README and submission

The user will tell you which phase to work on. Do not jump ahead.

## What's Out of Scope

See docs/spec.md for the full out-of-scope list. The MVP does NOT include:
- User authentication
- Databases
- Tech Spec and Meeting Notes implementations (architecture ready, prompts/rubrics stubbed)
- File export

If the user asks for something out of scope, gently flag it and confirm before proceeding.
