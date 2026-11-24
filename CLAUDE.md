# CLAUDE.md: FairStep

## Project
FairStep: "Every step fair. Every step on record." A disciplinary-process and case-record tool for South African small businesses (5–50 employees). Capstone by Mandla Sikhosana. **Hard deadline: Wed 25 Nov 2026, 15:30 SAST.**

Key docs: [BUSINESS.md](BUSINESS.md), [docs/PRD.md](docs/PRD.md) (roles, rules R1–R11, ERD, permission matrix), [docs/stitch-prompts.md](docs/stitch-prompts.md), docs/designs/ (Stitch exports, the source of truth for UI).

## Current phase
**Phase 0 (done):** business docs, PRD, Stitch prompts, public repo https://github.com/mandlenkosii/fairstep
**Phase 1 (done):** Stitch exports in docs/designs/ (named `NN-screen-device.png`, tokens in `design-system.md`), Stitch link and design gallery in README. Design copy that conflicts with the PRD (e.g. "Schedule 8", "48 hours", crypto claims, ACAS) is not used.
**Phase 2 (done):** IMPLEMENTATION_PLAN.md, issues #1–#34 with labels and 6 milestones, scaffold, CI, design tokens, UI components, stepper, app shell, landing page, log-in/sign-up screens (PRs #35–#43).
**Phase 3 (done):** workflow rules R1–R11, Supabase clients, schema, RLS, private storage, auth, proxy route protection, seed with 3 test logins, RLS tests in CI (PRs #47–#55). Hosted Supabase project is migrated and seeded.
**Phase 4 (done):** live at https://fairstep.vercel.app (Vercel, auto-deploys main + PR previews); employee register, incident log with private evidence (browser uploads straight to storage, then `recordEvidence`), start a case + case page with stepper, blocked reasons and timeline (PRs #57–#60).
**Phase 5 (done):** step forms, PDF letters, consultant review, timeline + CCMA bundle, admin, owner dashboard, states + responsive polish, Playwright e2e in CI (PRs #62–#69). UI humanized with `motion` (PR #71), keeping teal + ochre.
**Phase 6 (done):** README with live screenshots, docs/QA.md (live QA + axe), docs/LOOM_SCRIPT.md, docs/SUBMISSION.md (PRs #73–#76). Left for Mandla: record the Loom, add Loom + portfolio repo links, post. Further UI changes wait for Mandla’s instructions.

| Phase | Due (SAST) | Scope |
|---|---|---|
| 1 | Mon 23 Nov 10:00 | Designs + Stitch link in README; check-in checklist |
| 2 | Mon 23 Nov 15:30 | IMPLEMENTATION_PLAN.md via PR, issues + labels + milestones, scaffold, design system components |
| 3 | Tue 24 Nov 10:00 | Supabase schema, RLS, storage policies, auth, route protection, seed, CI, RLS tests |
| 4 | Tue 24 Nov 15:30 | Vercel deploy; employees, incidents, workflow start live |
| 5 | Wed 25 Nov 10:00 | All Must features, polish, states, Playwright e2e |
| 6 | Wed 25 Nov 14:00 | README complete, QA, Loom script, submission post |

## Stack
Next.js (App Router) + TypeScript strict + Tailwind · Supabase (Postgres, Auth, Storage, RLS; migrations in `supabase/migrations`, seed in `scripts/seed.mjs`) · Server Actions with zod · @react-pdf/renderer · Vitest + RTL · Playwright · ESLint + Prettier · GitHub Actions · Vercel.

## Code notes
- **Next.js 16**: read `node_modules/next/dist/docs/` before using an API. Middleware is now `src/proxy.ts`. `cacheComponents` is off on purpose (pages read the session).
- Tokens in `src/app/globals.css` (`bg-primary`, `text-muted`, `border-line`, `bg-paper`, `text-warning-strong`…). Ochre `accent` is for rings/dots only, never text.
- Components: `src/components/ui` (Button, ButtonLink, Badge, Card, Field + Input/Textarea/Select), `stepper/Stepper` (`vertical`, `compact`), `shell/AppShell` (role nav), `shell/Disclaimer`.
- Validation: zod schemas in `src/lib/validation/`, reused by forms and server actions.
- Workflow: `canTransition(case, toStep, now)` in `src/lib/workflow/rules.ts` returns `{ ok }` or plain-language `reasons`; server actions must call it before every step change. Build its `WorkflowCase` input from the case row.
- Supabase clients in `src/lib/supabase/`: `server.ts` (acts as the user, RLS applies), `client.ts` (browser), `admin.ts` (secret key, bypasses RLS, `server-only`; only after a server-side role check). Types: `database.types.ts`.
- Auth: `src/proxy.ts` refreshes the session and sends signed-out/wrong-role users away; `requireRole(role)` from `src/lib/auth/session.ts` must still be called in every page and server action (layouts don't re-run on navigation). Sign-up trigger always creates `business_owner`.
- Database rules to respect: composite FKs keep everything in one business; no deletes of case data (archive); `case_events` is append-only even for the service role; consultants can change only `review_status` (trigger); storage paths start with `<business_id>/`.
- DB commands (load `.env.local` first, e.g. `set -a && . ./.env.local && set +a` in Git Bash): apply migrations `npx supabase db push --remote="$SUPABASE_DB_URL"`; regenerate types `npx supabase gen types typescript --db-url "$SUPABASE_DB_URL" --schema public > src/lib/supabase/database.types.ts`; seed once `npm run db:seed`; RLS tests `npm run test:rls` (CI uses local Supabase; against hosted only with `RLS_TESTS_ALLOW_REMOTE=1`).
- Pages: owner area `src/app/app/` (employees, incidents, cases). Case view model in `src/lib/workflow/view.ts` (`caseToWorkflow`, `buildStepperSteps`, `eventLabel`); `openCase` in `src/lib/cases/open-case.ts`; `advanceCase` re-runs `canTransition` server-side. Joins come back via `one()` (`src/lib/supabase/one.ts`).
- Live data is the demo: case_events are permanent, so don't test-advance seeded cases on the hosted DB; use realistic data or local Supabase.
- Test logins (password `FairStep-demo-2026`): `thabo@kasikitchen.test` (owner), `naledi@dlaminilabour.test` (consultant), `admin@fairstep.test` (admin).
- `npm run dev/build/start/test` go through `scripts/run.mjs`, which fixes Next.js (500 errors) and Vitest failing on a lowercase `c:\` Windows path. Markdown is excluded from Prettier.
- Checks before a PR: `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm test`, `npm run build`.

## Roles
- `business_owner`: only businesses they're a member of (`business_members`).
- `consultant`: only assigned businesses (`consultant_assignments`); comment/review/approve; **never delete**, never edit case facts.
- `admin`: users, businesses, assignments, aggregate stats only.
Enforce with **RLS on every table + server-side checks**. Hidden buttons are not security.

## Conventions
- Legal basis: **Code of Good Practice: Dismissal (2025)**, which replaced Schedule 8 of the LRA. Never call it "Schedule 8" in UI or copy.
- Workflow rules are **pure functions** in `src/lib/workflow/`, configured by constants in `rules.config.ts`, each marked `// Verify with a qualified labour practitioner`. TDD: failing test first.
- `case_events` is append-only; no hard deletes of case data (archive instead).
- POPIA: collect only what a case needs; no ID numbers or home addresses; private storage buckets.
- Dates stored UTC, displayed SAST. Currency ZAR ("R149").
- UI copy: plain SA English, second person, no legalese. Disclaimer "not legal advice" in app footer, PDFs and docs.
- Git: one Issue per task → branch `feat/<issue#>-short-name` (or `chore/`, `docs/`, `test/`) → PR with "Closes #n" → merge only when CI is green. Conventional commits, small.
- **Mandla is the sole author of every commit and PR.** No `Co-Authored-By` trailers, no "Generated with Claude Code" lines in commits or PR bodies.
- Never commit secrets; `.env.local` is gitignored; keep `.env.example` updated.
- Seed data: fictional SA names/businesses (Kasi Kitchen, Ubuntu Guard Security, Ezulwini Spaza & Groceries, Bakwena Build Contractors; owner Thabo Mokoena; consultant Naledi Dlamini).
- Working style: show a short plan before each phase; stop at phase end with summary, files changed, manual steps; explain key code in plain language.
