# Build Checklist — Trust Layer

> Concrete, ordered, verifiable tasks for building the Trust Layer MVP.
> Work top-to-bottom. Don't skip phases. Each task has a "Verify" step — do it before moving on.
> Mark checkboxes as you complete tasks.

---

## Phase 0 — Scaffold (~30 min)

The goal: get a working empty Next.js app running on localhost. No project logic yet.

- [ ] **0.1** Open VS Code terminal in the project root (`Terminal → New Terminal`)
- [ ] **0.2** Confirm Node.js and npm are installed: `node --version` (≥ v18) and `npm --version`
- [ ] **0.3** Initialize Next.js: ask Claude Code to run `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint --use-npm`. Note the `.` — this scaffolds INTO the current directory. Accept any defaults Claude Code asks about.
  - Verify: `package.json`, `app/`, and `tailwind.config.ts` files appear in Explorer
- [ ] **0.4** Install runtime dependencies: `npm install openai react-markdown`
  - Verify: Both packages appear in `package.json` under `dependencies`
- [ ] **0.5** Create `.env.local` in project root with `OPENAI_API_KEY=your-key-here` (replace with real key). Add `OPENAI_MODEL=gpt-4o`.
  - Verify: `.env.local` exists; `.gitignore` already excludes it (Next.js handles this)
- [ ] **0.6** Run dev server: `npm run dev`. Open http://localhost:3000 in browser.
  - Verify: Default Next.js welcome page renders without errors
- [ ] **0.7** First Git commit: `git init && git add . && git commit -m "Phase 0: scaffold Next.js project"`

## Phase 1 — Foundation Files (~45 min)

Build pure utility code that has no UI and no AI calls. This is where types, the score calculator, the doc-type registry, and the rubric/prompt files live.

- [ ] **1.1** Create `lib/types.ts` with TypeScript interfaces: `Question`, `Answer`, `Assumption`, `RuleResult`, `PromptAnalysisResponse`, `GenerateResponse`, `ValidateResponse`, `DocType` (union of "prd" | "tech-spec" | "meeting-notes")
  - Verify: TypeScript compiles (`npx tsc --noEmit`); no errors
- [ ] **1.2** Create `lib/doc-types.ts` — registry exporting an array of `{ id, label, enabled }` for the three doc types. PRD enabled, others disabled.
  - Verify: Can import and console.log the array
- [ ] **1.3** Create `lib/score.ts` — pure function `computeScore(rules, assumptions?)` returning `{ score, recommendation }`. Implement formula from spec section 8.
  - Verify: Test with sample inputs (e.g., 10 passing rules → 100; 0 passing → 0; 5 passing + 3 risky assumptions → 100 - 5*8 - 3*3 = 51)
- [ ] **1.4** Create `lib/openai.ts` — singleton OpenAI client reading `OPENAI_API_KEY` from env
  - Verify: Imports without error
- [ ] **1.5** Create `lib/rubrics/prompt/universal.ts` — exports the 5 universal rules array
  - Verify: Imports successfully
- [ ] **1.6** Create `lib/rubrics/prompt/prd.ts` — exports the 3 PRD-specific add-on rules
  - Verify: Imports successfully
- [ ] **1.7** Create `lib/rubrics/prompt/tech-spec.ts` and `lib/rubrics/prompt/meeting-notes.ts` as stubs (empty arrays with TODO comments)
  - Verify: Files exist
- [ ] **1.8** Create `lib/rubrics/prompt/index.ts` — exports `getPromptRubric(docType)` that merges universal + doc-type add-ons
  - Verify: `getPromptRubric("prd")` returns 8 rules
- [ ] **1.9** Create `lib/rubrics/document/prd.ts` with the 10 PRD rules from spec section 10
  - Verify: Imports as array of strings
- [ ] **1.10** Create `lib/rubrics/document/tech-spec.ts` and `lib/rubrics/document/meeting-notes.ts` as stubs
  - Verify: Files exist
- [ ] **1.11** Create `lib/rubrics/document/index.ts` — exports `getDocumentRubric(docType)` lookup
  - Verify: `getDocumentRubric("prd")` returns 10 rules
- [ ] **1.12** Create `lib/prompts/prd.ts` — exports three system prompts: `PRD_CLARIFY_PROMPT`, `PRD_GENERATE_PROMPT`, `PRD_VALIDATE_PROMPT`. Each must enforce strict JSON output and include an example.
  - Verify: All three prompts exported
- [ ] **1.13** Create `lib/prompts/tech-spec.ts` and `lib/prompts/meeting-notes.ts` as stubs
- [ ] **1.14** Create `lib/prompts/index.ts` — exports lookup functions by docType
  - Verify: `getClarifyPrompt("prd")` returns the prompt string
- [ ] **1.15** Commit: `git add . && git commit -m "Phase 1: foundation files (types, score, rubrics, prompts)"`

## Phase 2 — API Routes (~60 min)

Build the four backend endpoints. Each is a Next.js App Router route handler.

- [ ] **2.1** Create `app/api/analyze-prompt/route.ts` — POST handler. Calls OpenAI with `getPromptRubric(docType)`. Computes score server-side via `computeScore`. Returns `PromptAnalysisResponse`.
  - Verify: `curl -X POST http://localhost:3000/api/analyze-prompt -H "Content-Type: application/json" -d '{"prompt":"a study app","docType":"prd"}'` returns valid JSON with score
- [ ] **2.2** Create `app/api/clarify/route.ts` — POST handler. Calls OpenAI with `getClarifyPrompt(docType)`. Returns `{ questions: string[] }`.
  - Verify: `curl` returns 3-5 questions
- [ ] **2.3** Create `app/api/generate/route.ts` — POST handler. Builds combined prompt from original + Q&A pairs. Returns `{ document, assumptions }`.
  - Verify: `curl` returns markdown document and assumptions array
- [ ] **2.4** Create `app/api/validate/route.ts` — POST handler. Calls OpenAI with `getValidatePrompt(docType)` (note: this is the validate-the-document prompt, distinct from analyze-prompt). Computes score server-side. Returns `ValidateResponse`.
  - Verify: `curl` with sample PRD returns rules + score
- [ ] **2.5** Add basic error handling to all four routes: try/catch around OpenAI call; return 500 with friendly error JSON on failure
  - Verify: Sending a bad request returns a clean error, not a crash
- [ ] **2.6** Commit: `git add . && git commit -m "Phase 2: API routes (analyze-prompt, clarify, generate, validate)"`

## Phase 3 — UI (~90 min)

Build the single-page app. State is managed in `app/page.tsx`. Use a `step` variable to drive the flow.

- [ ] **3.1** In `app/page.tsx`, add `"use client"` directive. Define state: `step`, `docType`, `prompt`, `promptAnalysis`, `questions`, `answers`, `result` (combined generate + validate result), `loading`, `error`.
- [ ] **3.2** Build Step 1 — Select Document Type: three cards (PRD enabled, others disabled with "Coming soon" badges). On Continue → set step to "input"
  - Verify: Can click PRD and proceed; cannot click others
- [ ] **3.3** Build Step 2 — Input: textarea + "Analyze prompt" button. On click, calls `/api/analyze-prompt`, sets `promptAnalysis`, advances to "analyze" step
  - Verify: Loading state shows; advances after response
- [ ] **3.4** Build Step 3 — Analyze: render score badge, recommendation, list of failed rules, suggestions, editable prompt textarea. Two buttons: "Edit and re-analyze" (re-runs API), "Continue anyway" (advances to "clarify")
  - Verify: Editing prompt and re-analyzing updates score; Continue advances
- [ ] **3.5** Build Step 4 — Clarify: render each question with answer textarea + Skip link. "Generate document" button. On click, calls `/api/generate` AND `/api/validate` in sequence, sets `result`, advances to "review"
  - Verify: All questions render; can answer or skip; generation runs and lands on review
- [ ] **3.6** Build Step 5 — Generate: a loading-only screen between Clarify and Review; auto-advances when result is ready (handled in 3.5; this is just a visual transition)
- [ ] **3.7** Build Step 6 — Review: side-by-side trust scores at top, document type label, rendered document via react-markdown, three collapsible sections (prompt feedback, assumptions, validation rules), Copy Document and Start Over buttons
  - Verify: Both scores render; document is readable; collapsibles work; copy puts markdown on clipboard
- [ ] **3.8** Apply Tailwind dark theme styling: `bg-zinc-950`, `text-zinc-100`, max-width 768px centered column. Color-coded score badges (green/yellow/orange/red bands per spec)
  - Verify: Visual is dark, centered, readable
- [ ] **3.9** Commit: `git add . && git commit -m "Phase 3: UI for all six steps"`

## Phase 4 — Polish (~30 min)

- [ ] **4.1** Error states: red banner at top of each step on API failure with "Try again" button
- [ ] **4.2** Disable buttons while loading
- [ ] **4.3** Page metadata: title "Trust Layer — AI Document Review", favicon
- [ ] **4.4** Empty-state placeholder text in textarea
- [ ] **4.5** Accessibility pass: each form field has a label; focus styles visible
- [ ] **4.6** Commit: `git add . && git commit -m "Phase 4: polish and error handling"`

## Phase 5 — Deploy (~20 min)

- [ ] **5.1** Create GitHub repo: `gh repo create trust-layer --public --source=. --push`. (Or create on github.com manually and push.)
- [ ] **5.2** Push current code to main
- [ ] **5.3** Sign in to Vercel (vercel.com), import the GitHub repo
- [ ] **5.4** Add environment variables in Vercel: `OPENAI_API_KEY`, `OPENAI_MODEL`
- [ ] **5.5** Deploy. Wait for green checkmark.
- [ ] **5.6** Test the deployed URL end-to-end with a real prompt
  - Verify: Full flow works on production URL

## Phase 6 — Submission (~30 min)

- [ ] **6.1** Create `README.md` in project root: one-line pitch, demo URL at top, screenshot or 30-sec GIF, "How it works" (4-step description), tech stack, "Built with spec-driven development" with link to `docs/`, local setup (4 commands), MIT license
- [ ] **6.2** Create `docs/reflection.md`: write what you learned, what was hard, what you'd do differently, the meta-loop ("a tool that scores prompts, built using spec-driven development")
- [ ] **6.3** Zip the `docs/` folder for Devpost private submission
- [ ] **6.4** On Devpost: project description, demo URL, repo URL, upload zipped docs/, submit
- [ ] **6.5** Final commit: `git add . && git commit -m "Submission ready" && git push`

## What to Cut If Behind Schedule

In order — never cut things above:
1. Iterative re-analyze (Phase 3.4 — just show feedback, no edit loop)
2. Tech Spec / Meeting Notes selector entries (Phase 3.2 — only show PRD)
3. Risky/reasonable assumption tagging (Phase 1.12, 2.3 — flat assumption list)
4. Polish features (Phase 4 — error states beyond a basic alert)
5. Color coding of score badge (Phase 3.8 — just show the number)

NEVER cut: dual scores, document validation, assumptions list. Those are the demo.

## Total Time Estimate

| Phase | Time |
|---|---|
| 0. Scaffold | 30 min |
| 1. Foundation | 45 min |
| 2. API routes | 60 min |
| 3. UI | 90 min |
| 4. Polish | 30 min |
| 5. Deploy | 20 min |
| 6. Submission | 30 min |
| **Total** | **~5 hours of focused work** |

Realistic with breaks, learning, and debugging: 8-10 hours. Spread across 2 days.
