# FairStep: final QA

**Live link:** https://fairstep.vercel.app · **Date:** Tue 24 Nov 2026 · **Build:** `main` after PR #74 (README)

QA was run against the **live** site with the three seeded test logins, in Chromium (Playwright), at phone (360px), tablet (768px) and desktop (1440px) widths. Checks that change data were run on a local Supabase in CI instead (see "Automated" below), because case history on the live demo can't be deleted.

## Results

| Area | Check | Result |
| --- | --- | --- |
| Auth | Signed out: `/app`, `/consultant`, `/admin` redirect to log in | ✅ |
| Auth | Wrong password shows a plain message ("That email and password don't match…") | ✅ |
| Auth | Case bundle download while signed out → 401 | ✅ |
| Roles | Owner on `/admin` or `/consultant` → sent to `/app` | ✅ |
| Roles | Owner opening another business's case → 404 page (nothing revealed) | ✅ |
| Roles | Consultant opening an unassigned business's case or bundle → 404 | ✅ |
| Roles | Consultant case view has no Save / Continue / Generate controls | ✅ |
| Roles | Admin: bundle → 404; overview shows counts only, no employee names | ✅ |
| Workflow | Blocked step shows the plain-language reason (R6 on FS-2026-0011) | ✅ |
| Letters | Generated notice of hearing opens through its signed link (PDF) | ✅ |
| Bundle | Owner downloads the case bundle (application/pdf) | ✅ |
| Layout | No sideways scrolling on 16 pages × 360 / 768 / 1440px | ✅ |
| Accessibility | axe WCAG 2.1 AA (serious/critical) on 13 key pages, all roles | ✅ after fix below |
| Pages | Every page loads (200, no error screen, no browser errors) for all three roles | ✅ |

## Issues found and fixed during QA

| Issue | Fix |
| --- | --- |
| The current step lost its ochre ring (the pulse animation replaced the ring) | PR #73: pulse moved to a separate layer |
| Queue tabs read "Waiting for review(1)" (missing space) | PR #73 |
| Landing page: axe flagged 5 contrast issues on the hero preview card (it read the decorative glow as the card's background) | This PR: the card sits on its own layer above the glow; 0 issues |
| Earlier: tables overflowed at 768px; tab and back links under 44px | PR #68 |

## Automated (every pull request, in CI)

- **207 unit tests:** workflow rules R1–R11, SAST dates and working days, letters, bundle, dashboard, validation, components
- **22 RLS tests** against a fresh local Supabase: tenant isolation, roles, review sign-off, no hard deletes, append-only timeline (even for the service role), private storage, admin counts only
- **Playwright end to end:** owner logs an incident → investigation → notice + PDF → hearing → outcome → sends for review → consultant approves → owner exports the bundle; plus a consultant-isolation test
- Lint, Prettier, TypeScript (strict), production build

## Still worth a manual look

- Open the live link on a real Android phone and an iPhone: log in, log an incident with a photo from the camera, open a case.
- Print a generated letter to check it looks right on paper.

Known limits are listed in the [README](../README.md#known-issues-and-limits).
