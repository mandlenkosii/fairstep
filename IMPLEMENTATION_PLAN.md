# FairStep: Implementation Plan

**Final deadline:** Wed 25 Nov 2026, 15:30 SAST. Work after that doesn't count.

Each phase ends at a check-in and has a matching GitHub milestone. Every task is a GitHub Issue. The numbers in the tables below link to the issues.

Related: [BUSINESS.md](BUSINESS.md) · [PRD](docs/PRD.md) · [Stitch prompts](docs/stitch-prompts.md) · [Designs](docs/designs/)

## How we work

1. **One issue per task.** Branch `feat/<issue#>-short-name` (or `chore/`, `docs/`, `test/`, `ci/`).
2. **TDD** for logic: failing test → code → refactor. The workflow rules (#19) are pure functions with a test for every rule.
3. **Pull request** with `Closes #n`. **Merge only when CI is green** (lint, typecheck, tests, build).
4. **Small conventional commits** (`feat:`, `fix:`, `test:`, `chore:`, `docs:`, `ci:`).
5. **Security in the backend.** RLS on every table plus server-side checks in Server Actions. Hidden buttons are not security.
6. **No secrets in git.** `.env.local` is ignored; `.env.example` lists every variable.

**Definition of done** for an issue: acceptance criteria met · tests added or updated · CI green · works at 360px and 1440px · PR merged and the issue closed.

## Architecture

```mermaid
flowchart LR
  U[Owner / Consultant / Admin<br/>phone or desktop browser] --> V[Next.js App Router on Vercel]
  V -->|Server Components: reads| S[(Supabase Postgres<br/>RLS on every table)]
  V -->|Server Actions + zod: writes| S
  V -->|signed URLs| ST[(Supabase Storage<br/>private buckets)]
  V -->|@react-pdf/renderer| PDF[Letters + CCMA bundle PDFs]
  PDF --> ST
  V --> A[Supabase Auth]
  W[src/lib/workflow<br/>pure rule functions] --> V
```

- **Reads** run in Server Components with the user's session, so RLS filters every query.
- **Writes** go through Server Actions. Each one validates input with zod, checks the user's role and membership, and re-runs the workflow rules before saving.
- **Workflow rules** (`src/lib/workflow/`) have no database or framework code, so they're fast to test.
- **Audit trail:** every mutation inserts a `case_events` row. There are no update or delete policies on that table.

## Phase 1: Designs (Mon 23 Nov 10:00) ✅

| # | Task | Label |
|---|---|---|
| [#1](https://github.com/mandlenkosii/fairstep/issues/1) | Stitch designs and link in README | docs |

## Phase 2: Plan, scaffold, design system (Mon 23 Nov 15:30)

| # | Task | Label |
|---|---|---|
| [#2](https://github.com/mandlenkosii/fairstep/issues/2) | This implementation plan | docs |
| [#3](https://github.com/mandlenkosii/fairstep/issues/3) | Scaffold Next.js, TypeScript strict, Tailwind, ESLint, Prettier, Vitest | infra |
| [#4](https://github.com/mandlenkosii/fairstep/issues/4) | GitHub Actions CI (lint, typecheck, test, build) | infra |
| [#5](https://github.com/mandlenkosii/fairstep/issues/5) | Design tokens, fonts and logo | feature |
| [#6](https://github.com/mandlenkosii/fairstep/issues/6) | Base UI components | feature |
| [#7](https://github.com/mandlenkosii/fairstep/issues/7) | Fair Steps stepper component | feature |
| [#8](https://github.com/mandlenkosii/fairstep/issues/8) | App shell and disclaimer footer | feature |
| [#9](https://github.com/mandlenkosii/fairstep/issues/9) | Landing page | feature |
| [#10](https://github.com/mandlenkosii/fairstep/issues/10) | Log in and sign up screens | feature |

CI (#4) moves forward from Phase 3 so that every PR from now on is checked.

## Phase 3: Data, auth and rules (Tue 24 Nov 10:00)

| # | Task | Label |
|---|---|---|
| [#11](https://github.com/mandlenkosii/fairstep/issues/11) | Supabase project, client helpers, env vars | infra |
| [#12](https://github.com/mandlenkosii/fairstep/issues/12) | Database schema migrations | feature |
| [#13](https://github.com/mandlenkosii/fairstep/issues/13) | RLS policies on every table | feature |
| [#14](https://github.com/mandlenkosii/fairstep/issues/14) | Private storage buckets and policies | feature |
| [#15](https://github.com/mandlenkosii/fairstep/issues/15) | Auth: sign up, log in, log out | feature |
| [#16](https://github.com/mandlenkosii/fairstep/issues/16) | Role-based route protection | feature |
| [#17](https://github.com/mandlenkosii/fairstep/issues/17) | Seed data with three test accounts | infra |
| [#18](https://github.com/mandlenkosii/fairstep/issues/18) | RLS tests: tenant isolation, append-only audit | test |
| [#19](https://github.com/mandlenkosii/fairstep/issues/19) | Workflow rules engine R1–R11 (TDD) | feature |

## Phase 4: Live deploy and first features (Tue 24 Nov 15:30)

| # | Task | Label |
|---|---|---|
| [#20](https://github.com/mandlenkosii/fairstep/issues/20) | Deploy to Vercel | infra |
| [#21](https://github.com/mandlenkosii/fairstep/issues/21) | Employee register (M1) | feature |
| [#22](https://github.com/mandlenkosii/fairstep/issues/22) | Incident log with private evidence (M1) | feature |
| [#23](https://github.com/mandlenkosii/fairstep/issues/23) | Start a case and show the stepper (M2) | feature |

## Phase 5: All Must features (Wed 25 Nov 10:00)

| # | Task | Label |
|---|---|---|
| [#24](https://github.com/mandlenkosii/fairstep/issues/24) | Workflow step forms (M2) | feature |
| [#25](https://github.com/mandlenkosii/fairstep/issues/25) | PDF letters (M3) | feature |
| [#26](https://github.com/mandlenkosii/fairstep/issues/26) | Consultant review and sign-off (M4) | feature |
| [#27](https://github.com/mandlenkosii/fairstep/issues/27) | Case timeline and CCMA-ready bundle (M5) | feature |
| [#28](https://github.com/mandlenkosii/fairstep/issues/28) | Admin overview | feature |
| [#29](https://github.com/mandlenkosii/fairstep/issues/29) | Owner dashboard (Should S1) | feature |
| [#30](https://github.com/mandlenkosii/fairstep/issues/30) | Loading, empty, error states; responsive polish | feature |
| [#31](https://github.com/mandlenkosii/fairstep/issues/31) | Playwright e2e for the main flow | test |

## Phase 6: Submission (Wed 25 Nov 14:00)

| # | Task | Label |
|---|---|---|
| [#32](https://github.com/mandlenkosii/fairstep/issues/32) | Complete README | docs |
| [#33](https://github.com/mandlenkosii/fairstep/issues/33) | Final QA on the live link | test |
| [#34](https://github.com/mandlenkosii/fairstep/issues/34) | Loom script and submission post | docs |

Buffer: 14:00–15:30 on Wed for fixes and submitting.

## If we fall behind

We cut in this order and never cut a brief requirement (login + roles, RLS, all five Must features, responsive UI, tests + CI, issue/PR workflow):

1. Could features (Afrikaans / isiZulu labels, WhatsApp reminders), which aren't planned anyway.
2. Should S2 email notifications and S3 employee acknowledgement links, which aren't planned anyway.
3. Admin audit-log screen (keep businesses + assignments + stats).
4. Owner dashboard (#29) becomes a simple list of open cases.
5. Bundle export (#27) without embedded letter PDFs: it lists them with dates instead.

## Disclaimer

FairStep provides process guidance and record-keeping. It is not legal advice. Workflow rules and notice periods are configurable constants that a qualified labour practitioner must verify.
