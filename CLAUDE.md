# CLAUDE.md: FairStep

## Project
FairStep: "Every step fair. Every step on record." A disciplinary-process and case-record tool for South African small businesses (5–50 employees). Capstone by Mandla Sikhosana. **Hard deadline: Wed 25 Nov 2026, 15:30 SAST.**

Key docs: [BUSINESS.md](BUSINESS.md), [docs/PRD.md](docs/PRD.md) (roles, rules R1–R11, ERD, permission matrix), [docs/stitch-prompts.md](docs/stitch-prompts.md), docs/designs/ (Stitch exports, the source of truth for UI).

## Current phase
**Phase 0 (done):** business docs, PRD, Stitch prompts, public repo https://github.com/mandlenkosii/fairstep
**Phase 1 (done):** Stitch exports in docs/designs/ (named `NN-screen-device.png`, tokens in `design-system.md`), Stitch link and design gallery in README. Design copy that conflicts with the PRD (e.g. "Schedule 8", "48 hours", crypto claims, ACAS) is not used.
**Phase 2 (done):** IMPLEMENTATION_PLAN.md, issues #1–#34 with labels and 6 milestones, scaffold, CI, design tokens, UI components, stepper, app shell, landing page, log-in/sign-up screens (PRs #35–#43).
**Phase 3 (next):** issues #11–#19 (Supabase, schema, RLS, storage, auth, route protection, seed, RLS tests, workflow rules).

| Phase | Due (SAST) | Scope |
|---|---|---|
| 1 | Mon 23 Nov 10:00 | Designs + Stitch link in README; check-in checklist |
| 2 | Mon 23 Nov 15:30 | IMPLEMENTATION_PLAN.md via PR, issues + labels + milestones, scaffold, design system components |
| 3 | Tue 24 Nov 10:00 | Supabase schema, RLS, storage policies, auth, route protection, seed, CI, RLS tests |
| 4 | Tue 24 Nov 15:30 | Vercel deploy; employees, incidents, workflow start live |
| 5 | Wed 25 Nov 10:00 | All Must features, polish, states, Playwright e2e |
| 6 | Wed 25 Nov 14:00 | README complete, QA, Loom script, submission post |

## Stack
Next.js (App Router) + TypeScript strict + Tailwind · Supabase (Postgres, Auth, Storage, RLS; migrations in `supabase/migrations`, `supabase/seed.sql`) · Server Actions with zod · @react-pdf/renderer · Vitest + RTL · Playwright · ESLint + Prettier · GitHub Actions · Vercel.

## Code notes
- **Next.js 16**: read `node_modules/next/dist/docs/` before using an API. Middleware is now `src/proxy.ts`. `cacheComponents` is off on purpose (pages read the session).
- Tokens in `src/app/globals.css` (`bg-primary`, `text-muted`, `border-line`, `bg-paper`, `text-warning-strong`…). Ochre `accent` is for rings/dots only, never text.
- Components: `src/components/ui` (Button, ButtonLink, Badge, Card, Field + Input/Textarea/Select), `stepper/Stepper` (`vertical`, `compact`), `shell/AppShell` (role nav), `shell/Disclaimer`.
- Validation: zod schemas in `src/lib/validation/`, reused by forms and server actions.
- `npm test` runs `scripts/vitest.mjs` (fixes Vitest on a lowercase `c:\` Windows path). Markdown is excluded from Prettier.
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
