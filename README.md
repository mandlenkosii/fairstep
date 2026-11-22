# FairStep

**Every step fair. Every step on record.**

FairStep helps small business owners run fair, fully documented disciplinary processes, so they stop losing CCMA cases on procedure.

> **Status:** Capstone in progress. Final submission due Wed 25 Nov 2026, 15:30 SAST.

| | |
|---|---|
| Live app | _coming in Phase 4 (Vercel)_ |
| Designs (Google Stitch) | _link added in Phase 1_ · exports in [`docs/designs/`](docs/designs/) |
| Business case | [BUSINESS.md](BUSINESS.md) |
| Product requirements | [docs/PRD.md](docs/PRD.md) |
| Stitch prompts | [docs/stitch-prompts.md](docs/stitch-prompts.md) |
| Implementation plan | _IMPLEMENTATION_PLAN.md (Phase 2)_ |

## The problem

- The CCMA registered **193,069 referrals in 2024/25**, and **51% were unfair dismissal** disputes ([Business Day, Sept 2026](https://www.businessday.co.za/news/2026-09-23-unfair-dismissals-make-up-more-than-half-of-ccma-cases/)).
- About **60% of the CCMA caseload** has historically come from small, medium and micro enterprises ([Engineering News, CCMA 2018/19](https://www.engineeringnews.co.za/article/large-scale-dismissals-continue-to-rise-in-labour-market-on-back-of-legislative-reform-4ir-2019-10-14)).
- Employers with legitimate cases often lose because the procedure was unfair, or the paperwork was wrong, lost or never recorded ([SME South Africa](https://smesouthafrica.co.za/why-employers-lose-ccma-cases/)).

A business with 8 employees has no HR department and can't pay a lawyer for every warning.

## The solution

FairStep is a mobile-first case manager. It guides an owner from **incident → investigation → notice of hearing → hearing → outcome → appeal**, in line with the 2025 *Code of Good Practice: Dismissal*. It **blocks unfair steps** and explains why in plain language. It generates the letters, lets the owner's labour consultant review and sign off the case, and exports the whole case as a timestamped, **CCMA-ready bundle**.

## Designs

Designed in Google Stitch (link above) from the prompts in [docs/stitch-prompts.md](docs/stitch-prompts.md). All exports are in [`docs/designs/`](docs/designs/).

_Screenshots are added once the Stitch exports are in._

## Who it's for

| Role | What they do |
|---|---|
| Business owner / case manager | Keeps the employee register, logs incidents, runs cases, generates letters |
| Labour consultant | Reviews, comments on and signs off cases for assigned client businesses |
| Platform admin | Manages users, businesses and consultant assignments |

## Planned stack

Next.js (App Router) · TypeScript (strict) · Tailwind CSS · Supabase (Postgres, Auth, Storage, Row Level Security) · @react-pdf/renderer · Vitest + React Testing Library · Playwright · GitHub Actions · Vercel

## Disclaimer

FairStep provides process guidance and record-keeping. **It is not legal advice.** Rules and notice periods are configurable and should be verified by a qualified labour practitioner. For advice on a specific matter, consult a labour law professional or the [CCMA](https://www.ccma.org.za/).
