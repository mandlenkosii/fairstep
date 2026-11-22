import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Disclaimer } from "@/components/shell/disclaimer";
import { Stepper, type StepperStep } from "@/components/stepper/stepper";

// Illustration only.
const pathway: StepperStep[] = [
  {
    key: "incident",
    label: "Incident documented",
    status: "completed",
    detail: "Facts written down the same day",
  },
  {
    key: "investigation",
    label: "Investigation",
    status: "completed",
    detail: "Findings recorded",
  },
  {
    key: "notice",
    label: "Notice of hearing",
    status: "current",
    detail: "2 working days to prepare",
  },
  { key: "hearing", label: "Hearing", status: "upcoming" },
  { key: "outcome", label: "Outcome", status: "upcoming" },
];

/** Split layout for log in and sign up: brand panel on desktop, single column on mobile. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto grid w-full max-w-6xl flex-1 md:grid-cols-2 md:px-8 md:py-12">
        <aside className="hidden flex-col rounded-l-2xl bg-primary p-10 text-white md:flex">
          <Link href="/" className="inline-flex items-center gap-2" aria-label="FairStep home">
            <Logo showWordmark={false} className="size-9 rounded-lg bg-paper p-1" />
            <span className="font-serif text-headline-md font-semibold">FairStep</span>
          </Link>
          <p className="mt-10 font-serif text-display font-semibold">
            Every step fair.
            <br />
            Every step on record.
          </p>
          <p className="mt-3 text-white/80">
            A calm, guided disciplinary process for South African small businesses.
          </p>
          <div className="mt-10 rounded-xl bg-surface p-5 text-ink">
            <Stepper steps={pathway} vertical />
          </div>
          <p className="mt-auto flex items-center gap-2 pt-8 text-sm text-white/80">
            <ShieldCheck aria-hidden className="size-4" />
            Based on the Code of Good Practice: Dismissal (2025)
          </p>
        </aside>

        <main className="flex flex-col justify-center bg-surface px-4 py-10 md:rounded-r-2xl md:border md:border-line md:px-12">
          <Link href="/" className="mb-8 self-center md:hidden" aria-label="FairStep home">
            <Logo />
          </Link>
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </main>
      </div>
      <footer className="px-4 py-6">
        <Disclaimer />
      </footer>
    </div>
  );
}
