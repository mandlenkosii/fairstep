import { Check, Download, FileText, ListChecks, NotebookPen } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import {
  BlockedStepPreview,
  HeroCasePreview,
  ReviewPreview,
} from "@/components/marketing/product-previews";
import { SiteHeader } from "@/components/marketing/site-header";
import { Disclaimer } from "@/components/shell/disclaimer";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const CODE_URL = "https://www.acts.co.za/labour-relations/n3470_notice_no__3470_of_2025";

const stats = [
  {
    value: "193,069",
    label: "CCMA referrals in 2024/25",
    source: "Business Day, Sept 2026",
    href: "https://www.businessday.co.za/news/2026-09-23-unfair-dismissals-make-up-more-than-half-of-ccma-cases/",
  },
  {
    value: "51%",
    label: "were unfair dismissal disputes",
    source: "Business Day, Sept 2026",
    href: "https://www.businessday.co.za/news/2026-09-23-unfair-dismissals-make-up-more-than-half-of-ccma-cases/",
  },
  {
    value: "~60%",
    label: "of the CCMA caseload comes from small businesses",
    source: "Engineering News, CCMA 2018/19",
    href: "https://www.engineeringnews.co.za/article/large-scale-dismissals-continue-to-rise-in-labour-market-on-back-of-legislative-reform-4ir-2019-10-14",
  },
];

const steps = [
  {
    icon: NotebookPen,
    title: "Log the incident",
    body: "Write down what happened the same day: date, place, witnesses and photos of the evidence.",
  },
  {
    icon: ListChecks,
    title: "Follow the fair steps",
    body: "Investigation, notice, hearing, outcome. FairStep tells you what comes next and stops unfair shortcuts.",
  },
  {
    icon: FileText,
    title: "Generate the letters",
    body: "Notice of hearing, written and final warnings, and the outcome letter, filled in from your case.",
  },
  {
    icon: Download,
    title: "Export a CCMA-ready bundle",
    body: "One PDF with the timeline, every step, the evidence list and all letters, if the case is referred.",
  },
];

const checklist = [
  "You investigated and wrote down what you found before calling a hearing.",
  "The employee got the allegations in writing.",
  "They had at least 2 working days to prepare.",
  "They knew they could bring a fellow employee or shop steward, and an interpreter.",
  "The person who chaired the hearing wasn't involved in the incident.",
  "The employee gave their side before you decided.",
  "You gave the outcome and your reasons in writing.",
];

const plans = [
  {
    name: "Starter",
    price: "R149",
    for: "Up to 10 employees",
    features: [
      "Employee register and incident log",
      "Guided fair-steps workflow",
      "Letters as PDFs",
    ],
  },
  {
    name: "Growth",
    price: "R299",
    for: "Up to 50 employees",
    popular: true,
    features: ["Everything in Starter", "Consultant review and sign-off", "CCMA-ready case bundle"],
  },
  {
    name: "Consultant",
    price: "R799",
    for: "Up to 15 client businesses",
    features: ["Review queue across clients", "Comment, request changes, approve", "Case bundles"],
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-12 md:grid-cols-[1.1fr_1fr] md:px-8 md:py-20">
          <div>
            <Badge tone="primary">Built for South African small businesses</Badge>
            <h1 className="mt-4 text-[2.5rem] leading-tight md:text-6xl">
              Every step fair. <span className="block text-primary">Every step on record.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted">
              FairStep helps small business owners run fair, fully documented disciplinary
              processes, so they stop losing CCMA cases on procedure.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/signup" size="lg">
                Start your 14-day free trial
              </ButtonLink>
              <ButtonLink href="#how-it-works" size="lg" variant="secondary">
                See how it works
              </ButtonLink>
            </div>
            <p className="mt-3 text-sm text-muted">No card needed. Cancel any time.</p>
          </div>
          <HeroCasePreview />
        </section>

        {/* Problem */}
        <section aria-labelledby="problem-heading" className="border-y border-line bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
            <h2 id="problem-heading" className="text-center font-sans label-caps text-muted">
              The problem: South Africa&apos;s CCMA in numbers
            </h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {stats.map((stat) => (
                <li key={stat.value} className="rounded-xl bg-paper p-6 text-center">
                  <p className="font-serif text-4xl font-semibold text-primary">{stat.value}</p>
                  <p className="mt-1 font-medium text-ink">{stat.label}</p>
                  <a
                    href={stat.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs text-muted underline underline-offset-2 hover:text-primary"
                  >
                    Source: {stat.source}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mx-auto mt-6 max-w-2xl text-center text-muted">
              Many employers lose because the procedure wasn&apos;t fair, or the paperwork was
              wrong, lost or never written down. A business with 8 employees has no HR department
              and can&apos;t pay a lawyer for every warning.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-headline-lg md:text-display">How it works</h2>
            <p className="mt-3 text-muted">
              FairStep follows the{" "}
              <a
                href={CODE_URL}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                Code of Good Practice: Dismissal (2025)
              </a>{" "}
              and guides you from the incident to a CCMA-ready file.
            </p>
          </div>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-line bg-surface p-6">
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary-tint text-primary">
                  <step.icon aria-hidden className="size-5" />
                </span>
                <p className="mt-4 label-caps text-muted">Step {index + 1}</p>
                <h3 className="mt-1 text-headline-sm">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Guardrail */}
        <section className="bg-surface">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8">
            <div>
              <Badge tone="danger">Fairness guardrail</Badge>
              <h2 className="mt-4 text-headline-lg md:text-display">
                We stop unfair steps before they happen
              </h2>
              <p className="mt-3 text-muted">
                Too little notice, no chance for the employee to respond, or a chairperson who is
                also the complainant: FairStep blocks the step and tells you why in plain language,
                so you can fix it before it costs you at the CCMA.
              </p>
            </div>
            <BlockedStepPreview />
          </div>
        </section>

        {/* Consultants */}
        <section id="consultants" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-8">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <ReviewPreview />
            <div>
              <Badge tone="info">For labour consultants</Badge>
              <h2 className="mt-4 text-headline-lg md:text-display">
                Built to work with your labour consultant
              </h2>
              <p className="mt-3 text-muted">
                Send a case to your consultant before you act. They see only the businesses they
                look after, read the full case, comment, ask for changes or sign it off, and every
                decision is recorded on the timeline.
              </p>
            </div>
          </div>
        </section>

        {/* Checklist (lead magnet) */}
        <section aria-labelledby="checklist-heading" className="bg-primary text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1fr_1.2fr] md:px-8">
            <div>
              <h2 id="checklist-heading" className="text-headline-lg text-white md:text-display">
                Is your disciplinary process CCMA-ready?
              </h2>
              <p className="mt-3 text-white/80">
                Check your last hearing against these seven points. If you can&apos;t tick them all,
                FairStep walks you through each one next time.
              </p>
              <ButtonLink
                href="/signup"
                size="lg"
                variant="secondary"
                className="mt-6 border-transparent"
              >
                Start your 14-day free trial
              </ButtonLink>
            </div>
            <ol className="space-y-3">
              {checklist.map((item) => (
                <li key={item} className="flex gap-3 rounded-lg bg-white/10 px-4 py-3">
                  <Check aria-hidden className="mt-0.5 size-5 shrink-0 text-accent" />
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          aria-labelledby="pricing-heading"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 md:px-8"
        >
          <div className="text-center">
            <h2 id="pricing-heading" className="text-headline-lg md:text-display">
              Simple pricing
            </h2>
            <p className="mt-3 text-muted">
              14-day free trial, no card needed. Prices per month, excluding VAT.
            </p>
          </div>
          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <li
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-xl border bg-surface p-6",
                  plan.popular ? "border-2 border-primary" : "border-line",
                )}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-headline-md">{plan.name}</h3>
                <p className="text-sm text-muted">{plan.for}</p>
                <p className="mt-4">
                  <span className="font-serif text-4xl font-semibold text-ink">{plan.price}</span>
                  <span className="text-muted"> / month</span>
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <ButtonLink
                  href="/signup"
                  variant={plan.popular ? "primary" : "secondary"}
                  className="mt-6"
                >
                  Start free trial
                </ButtonLink>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between md:px-8">
          <div>
            <Logo />
            <p className="mt-2 text-sm text-muted">Every step fair. Every step on record.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a href="#how-it-works" className="text-muted hover:text-ink">
              How it works
            </a>
            <a href="#pricing" className="text-muted hover:text-ink">
              Pricing
            </a>
            <Link href="/login" className="text-muted hover:text-ink">
              Log in
            </Link>
          </nav>
        </div>
        <div className="border-t border-line px-4 py-4">
          <Disclaimer />
          <p className="mt-1 text-center text-xs text-muted">
            © 2026 FairStep. A capstone project. Names in examples are fictional.
          </p>
        </div>
      </footer>
    </div>
  );
}
