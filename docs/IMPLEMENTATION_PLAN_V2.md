# MechMate AI — Implementation Plan v2

**Source of truth:** `C:\Users\DELL\Downloads\Untitled document (3).md` (the brief — 35 sections).
It **supersedes** the original PRD wherever they differ. Compatible PRD requirements are kept (see §0.3).

**Rule from the brief (§35):** preserve the core loop first —
SEARCH/SELECT TOPIC → UNDERSTAND TOPIC → LEARN SUBTOPICS → UNDERSTAND FORMULAS →
SEE EXAMPLES → PRACTISE → GET CORRECTIONS → RETEST OR CONTINUE → PROGRESS UPDATES.
No phase may break this loop.

---

## 0. Starting point (what exists today, commit `821ba4e`)

- Next.js 15 + Tailwind + KaTeX, black-blue marble theme, math-`x` logo
- Routes: `/`, `/learn/[subtopic]`, `/api/{ask,explain,attempts,progress,profile,events,auth}`
- Local Postgres 18 (`~/pgsql-data`, port 5433), Prisma schema: Better Auth tables
  (User/Session/Account/Verification) + Subject/Topic/Subtopic/Formula/PracticeQuestion/Attempt/Progress
- Better Auth: anonymous + **email**/password; profile stores field/level
- Seed: Physics/Kinematics/Velocity JSON → DB
- AI: Ollama-default provider interface, curated fallback when no model is installed

### 0.1 Gaps vs the brief (why new work is needed)

| Brief requirement | Today |
|---|---|
| Home = progress dashboard (§3) | Home = search + static cards |
| Topic has defined scope; COMPLETED vs MASTERED (§§5–6) | Only subtopic statuses (encountered/mastered/struggling/strong); "mastered" = single correct answer |
| Username+password signup, no email (§22); profile page (§24) | Email signup; no profile page |
| AI-created topics from free text + web research (§§4, 17–21) | Only curated seed topics; no web search |
| Study Mode vs AI Study Mode, shared progress (§§7–9) | Single static lesson page |
| Moderation 3-level + silent admin alerts + admin dashboard (§§27–29) | None |
| Academic integrity / AI scope limits (§§30–31) | Only informal prompt text |
| Privacy disclosure re external AI (§26) | None |

### 0.2 Kept from the PRD (still compatible)

Formula presentation (formula+meaning+symbols+units, details on demand), basic→challenging
examples, adaptive practice, concise corrections, retest loop, contextual refreshers,
free navigation with prerequisite warnings, student Q&A connected to current formula,
anonymous-first browsing, local-first free stack (Postgres/Ollama).

### 0.3 Key architectural constraint (§32)

CONTENT (subjects/topics/scopes/notes/formulas/examples/resources) and STUDENT LEARNING
STATE (started/progress/sections/completed/performance/weak/strong/mastery/recent) stay
in separate tables. AI-generated topics are content rows flagged `origin: 'ai' +
validationStatus`; never mixed into any user's state.

---

## Phase A — Home Dashboard (brief §§3, 7, 25)

**Goal:** home answers "what have I covered, what remains, what next" at a glance.

- New `/` composition: overall progress ring/bar, current-topics list with per-topic bars
  (e.g. Projectile Motion ██████░░░░ 60%), recently-studied strip, remaining count,
  continue buttons, profile icon (→ profile page from Phase C; shows guest state until then).
- `GET /api/dashboard`: one rollup query — topics started, sections covered/total (falls back
  to subtopic statuses until Phase B lands), recent activity from Attempt timestamps,
  strengths/weaknesses from summaries.
- Unauthenticated: dashboard shows curated topic catalogue + prompts guest mode (no fake data).
- Acceptance: signed-in user with Velocity practice sees non-zero progress, remaining count,
  and a working continue link; guest sees catalogue only.

## Phase B — Topic Completion & Mastery (brief §§5–7, 32)

**Goal:** completion (scope covered) and mastery (proven understanding) as separate states.

- Schema: `TopicScope` = ordered sections per topic (seeded, e.g. Projectile Motion's 9 items);
  `SectionCoverage(user, section, coveredAt)` — covered only by learning evidence
  (section viewed + linked practice attempted), never by clicks alone;
  `TopicState(user, topic, status: started|completed|mastered)`.
- Rules: COMPLETED = all scope sections covered. MASTERED = completed + consistent
  performance (e.g. ≥80% over ≥5 questions spanning ≥2 difficulty levels and all key
  concepts — thresholds in one config constant, tuned later). One easy answer can never confer mastery.
- Study Mode and AI Study Mode write to the SAME tables (shared progress, §7).
- Dashboard (Phase A) upgraded to show section checklists + completed/mastered badges.
- Backfill: existing Progress rows map to SectionCoverage for Velocity's sections.
- Acceptance: covering all sections ⇒ completed but NOT mastered; mastery appears only after
  the performance bar is met; both modes update the same record.

## Phase C — Username Auth & Profile (brief §§22–24, 26)

**Goal:** simple signup, persistent login, full profile; privacy honesty.

- Better Auth `username` plugin: signup = username + password + confirm (match checked
  client-side); email NOT required. Keep existing email sign-in and anonymous guest working
  (compatible, not removed); account linking for guest→username upgrade so progress survives.
- Session: long-lived cookie (stay logged in until explicit logout), profile icon in header.
- `/profile`: change username/name, change password, add/change recovery email (optional),
  theme color + light/dark toggle (persisted), learning preferences, privacy/safety info,
  logout, delete account (deletes User + attempts/progress/sessions per deletion policy).
- Privacy page/section disclosing external AI processing; "no absolute confidentiality"
  wording; secrets never flow through AI/moderation paths (audit the ask/explain routes).
- Migration: `username`/`displayUsername` columns; existing users unaffected.
- Acceptance: new user signs up with username only; survives browser restart logged in;
  delete removes all user rows; privacy page reachable from profile.

## Phase D — AI Topic Creation & Study Modes (brief §§4, 8–9, 17–21)

**Goal:** "Teach me X" works for topics we never curated, grounded in trustworthy sources.

- D1 (no new vendors): "Teach me…" request flow with explicit validation states
  (identifying subject → drafting scope → validating); AI Study Mode conversational UI
  (progressive teaching, in-lesson Q&A, "I don't understand" → different approach/analogy);
  Study Mode notes-browsing UI over the same content; both write Phase-B progress.
  Until web search lands, AI topics generate from the local model over a subscope template,
  marked `validationStatus: 'unvalidated'` and NOT counted toward completion.
- D2 (web): free search provider (candidate: Brave Search free tier or Serper free tier —
  decision at build time; Wikipedia/official docs direct fetch as supplement). Pipeline:
  query = topic text only (web-privacy §21 — never personal/progress data) → collect →
  tier-tag sources (Tier 1 official/universities/orgs → Tier 2 established edu → Tier 3
  supplementary, §18) → synthesize scope (no large copied sections, © respected) →
  validate → publish as `origin:'ai', validated` content → source list shown to student.
- Conflict (§19) and don't-know (§20) UI states: visible notice + differing sources, or
  honest "cannot confidently teach this" + sources + feedback invite. Never fake certainty.
- Acceptance: "Teach me Bernoulli's equation" yields subject + scope + subtopics + sources
  with tier tags; "I don't understand" re-explains differently; web-disabled build still
  teaches from local model with unvalidated badge.

## Phase E — Safety, Integrity & Admin (brief §§27–31)

**Goal:** responsible moderation with a reviewable admin surface; teaching-first AI.

- Classification on AI inputs/outputs: NORMAL (answer) / RESTRICTED (refuse+redirect, no alert)
  / SERIOUS (refuse/block + silent safety alert). Free implementation: prompt-level
  self-check + denylist + provider moderation endpoint when the configured provider offers
  one; all decisions logged with rule/model version. "Silent" = no user-facing disruption.
- `SafetyAlert` table: account identifier, timestamp, policy category, violating request,
  ≤5 relevant messages, action taken, blocked/refused flag, review state. Minimum necessary
  data only — never passwords/tokens/keys.
- Admin area (`/admin`, role-gated via `User.role`, first admin bootstrapped from env):
  alerts queue, detail view, mark-reviewed / dismiss / escalate. Privacy policy documents
  that moderation exists and what admins see.
- System prompts: educational scope limits (§30) + academic-integrity stance (§31: teach
  how, don't complete work for the student) applied to ask/explain/study-mode paths.
- Acceptance: disallowed request refused without drama; serious case creates a minimal alert
  visible in admin; non-admin cannot reach `/admin`; policy text matches behavior.

---

## Build order & dependencies

A → B → C → D → E. Dashboard first (visible value, thin backend), then the data model it
deserves, then identity, then generative features, then safety gating the generative paths.
D2 (paid-vendor-free search key) is the only external dependency; everything else is local.

## Definition of done (MVP per §34)

Core loop intact; dashboard/progress/mastery live; username auth + profile; at least one
end-to-end AI-created topic; safety/admin reviewable; privacy text shipped. Secondary
features wait until the loop is proven.
