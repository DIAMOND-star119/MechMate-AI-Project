# MechMate AI — Implementation Plan

**Source of truth:** `docs/MechMate AI — Product Requirements Document (PRD).md`  
**Status:** Concept / Early Product Definition — no code yet  
**MVP target (PRD §21):** Topic → Subtopic → Concept → Formula → Symbols/Units → Basic Example → Challenging Example → Adaptive Practice → Results → Corrections → Retest/Continue  
Plus: search, recommended subtopics, free navigation, student questions, basic progress, refreshers, optional derivation / related-formulas

**Success standard (PRD §22):** “Did the student understand enough to apply the concept themselves?” — not “Did they get the answer?”

---

## 0. Current State

- `docs/MechMate AI — Product Requirements Document (PRD).md` — 22 sections, complete
- `README.md` — distilled from PRD
- No app, design system, or architecture yet
- Git: `main` clean, synced with `origin/main`

First vertical slice: **Physics → Kinematics** (Displacement, Velocity, Acceleration, Equations of motion, Projectile motion — PRD §6). Math / Engineering reuse the same pattern later.

---

## Phase 1 — Design System

Goal: enforce PRD principles — concise by default, progressive disclosure, Learn → Apply → Practise → Reflect (§20).

### 1.1 Tokens & foundations
- Spacing / type scale optimized for readability, light/dark, high-contrast math
- Touch targets ≥44px, focus-visible states, reduced-motion support
- Math rendering: KaTeX as MVP default (fast), MathJax fallback evaluation. All formulas as LaTeX, never images.

### 1.2 Components (1:1 with PRD)
1. `SearchBar + SubtopicList + RecommendedPathBadge + PrerequisiteWarning` (§6)
2. `ConceptCard` — concise explanation (§7.1)
3. `FormulaCard {formula, symbol table, units} + ExpandableDetails {meaning, when, how}` (§7.2/§7.3, collapsed by default)
4. `ExampleCard {basic, challenging}` (§8)
5. `PracticePlayer {difficulty stepper, hint}` (§9)
6. `ResultsPanel {score, concise corrections, strengths}` (§10)
7. `RetestPrompt {correction → explanation → retest}` (§11)
8. `RefresherBanner {short, dismissible, return-to-context}` (§13)
9. `QuestionDrawer {ask, answer + connection to current formula}` (§14)
10. `NextUpCard {recommended vs free explore}` (§12)
11. `DeepDivePrompt {derivation?, related?} + EndOfLessonPrompt` (§17/§18)

### 1.3 Rules
- Formula details collapsed by default
- Corrections concise by default, no long solutions
- Refreshers never auto-expand to full lesson
- Recommendations guide, never block (student autonomy)

**Exit:** Component preview (Storybook or equivalent) with Kinematics mock data, mobile + desktop.

---

## Phase 2 — Architectural Decisions

Decided baseline (locked with user — free-tier choices):

- **Platform:** Web-only responsive MVP — Next.js + TypeScript + Tailwind + KaTeX. No native mobile for MVP (zero store cost, fastest). Mobile handled via responsive design only.
- **Repo:** Monorepo `apps/web` + `apps/api`
- **DB:** Local Postgres on user device via Prisma. No Supabase / Neon for MVP. Connection via `DATABASE_URL` to localhost, migrations in repo.
- **Hosting:** Fully local for MVP (`next dev` / `next start` on localhost). Zero hosting cost, avoids tunneling local Postgres to cloud. Defer Vercel Hobby (free) deploy until cloud DB decision.
- **Auth:** Better Auth with Postgres adapter. Anonymous + email/password only for MVP. No social logins yet (avoids OAuth setup, still free). Anonymous / guest browsing by default for immediate search (§16); optional upgrade to email account. Progress stored against `userId` in Postgres.
- **AI layer:** `lib/ai/` provider interface with Ollama (local) as default — e.g. Llama 3.1 8B / Phi-3 / Mistral. Completely free, offline-capable, matches local-first Postgres. Cloud fallback later via Gemini Flash free tier / Groq free tier without changing call sites. System prompt enforces “understanding before answers” + “answer exact question + connect to current formula.”
- **Content:** Curated seed JSON in repo (`content/kinematics/*.json`). AI generates wording at runtime but facts / units / answers come from curated source to avoid hallucinating units.

### Data model v1
```
Subject > Topic > Subtopic > Concept + Formula[] + Example[] + PracticeQuestion[]
Formula: latex, symbols[{name, meaning, unit}], when_to_use, deeper_explanation, derivation?, related_formula_ids?
Question: prompt_latex, difficulty 1-3, prerequisite_concept_ids, correct_answer, mistake_explanation_template
Attempt: question_id, user_answer, correct?, timestamp
Progress: encountered[], mastered[], struggling[], strong[] (§15)
```

### Decisions resolved (free-tier)
1. Web-only responsive MVP — no native mobile.
2. Fully local hosting for MVP — no cloud cost.
3. Ollama local LLM — $0, offline.
4. Better Auth anonymous + email/password only — $0, no OAuth setup.

**Exit:** ADRs (stack, DB, AI abstraction, math rendering) + repo scaffold + CI lint/test.

---

## Phase 3 — Core Learning Loop (Static, No AI)

Build Search → Learn → Examples with static seed content.

- Client-side fuzzy search over topics/subtopics
- Subtopic page layout, prerequisite warning (non-blocking)
- Validates design system + routing before AI complexity

**Exit:** Can complete Velocity lesson end-to-end without practice.

---

## Phase 4 — Practice / Results / Retest Engine

Deterministic rules first (§9-§11):

- Start difficulty 1, +1 on 2 consecutive correct, -1 / hold + supportive hint on struggle
- Corrections: correct answer + 1-2 sentence mistake explanation
- Strengths list derived from `mastered`
- Retest: only missed concepts, different question same concept

**Exit:** Unit-tested engine + Results → Retest loop with static questions.

---

## Phase 5 — AI Layer (Guardrailed)

Add AI only where PRD requires:

- `explainConcept`, `expandFormula`, `answerStudentQuestion(context-bound)`, `generateRefresher`, `derivation`, `relatedFormulas`
- Guardrails: max length, must cite current `formula_id` / `subtopic_id`, must end Q&A with 1-line connection, refresher template: title + 1-2 formulas + “back to question” link
- Fallback to curated content on AI failure

**Exit:** Q&A + refreshers + details working, prompt logs reviewable.

---

## Phase 6 — Personalization & Progression

- Persist `encountered / mastered / struggling / strong` (§15)
- Influence recommendations + suppress repeat intros (e.g. skip Velocity intro if mastered)
- Next-up recommender: prerequisite graph + weakest-first, always allow free jump

**Exit:** Returning user sees different recommendations than new user.

---

## Phase 7 — MVP Hardening

- Optional onboarding (field / level), end-of-lesson application prompt (§18)
- Empty / loading / error states
- Basic analytics: completion rate, retest pass rate, time-to-apply (proxy for §22)
- Accessibility, performance, manual QA of full Kinematics path

**Exit:** MVP demo-ready per §21 checklist.

---

## Phase 8 — Post-MVP (Out of scope now)

Additional Math / Engineering topics, spaced repetition, teacher mode, offline. Do not build now.

---

## Next Step

DB (local Postgres), Auth (Better Auth anonymous + email), platform (web-only), hosting (local), AI (Ollama local) all locked on free tier. Next: scaffold monorepo + Better Auth + local Postgres + design tokens + Kinematics seed content.
