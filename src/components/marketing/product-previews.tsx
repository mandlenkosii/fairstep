import { CheckCircle2, Lock, MessageSquare } from "lucide-react";
import { Stepper, type StepperStep } from "@/components/stepper/stepper";
import { Badge } from "@/components/ui/badge";

// Example data for illustrations only. Names are fictional.
const exampleSteps: StepperStep[] = [
  { key: "incident", label: "Incident", status: "completed", detail: "Tue 17 Nov 2026" },
  { key: "investigation", label: "Investigation", status: "completed", detail: "Fri 20 Nov 2026" },
  { key: "notice", label: "Notice of hearing", status: "current", detail: "Delivered Mon 23 Nov" },
  { key: "hearing", label: "Hearing", status: "upcoming", detail: "Thu 26 Nov, 10:00" },
  { key: "outcome", label: "Outcome", status: "upcoming" },
  { key: "appeal", label: "Appeal", status: "upcoming", optional: true },
];

/** A phone-sized case card for the hero. */
export function HeroCasePreview() {
  return (
    <div
      aria-hidden
      className="relative z-10 mx-auto w-full max-w-sm rounded-[2rem] border-8 border-ink bg-paper p-4 shadow-xl"
    >
      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <p className="label-caps text-muted">Case FS-2026-0012</p>
            <p className="font-serif text-headline-sm">Sipho Ndlovu</p>
            <p className="text-xs text-muted">Waiter · Late coming (repeat)</p>
          </div>
          <Badge tone="warning">Step 3 of 6</Badge>
        </div>
        <Stepper steps={exampleSteps} vertical />
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-success-tint px-3 py-2 text-xs text-success-strong">
          <CheckCircle2 aria-hidden className="size-4 shrink-0" />
          Notice delivered. 2 working days to prepare.
        </p>
      </div>
    </div>
  );
}

/** The guardrail example: FairStep blocks a hearing that's too soon. */
export function BlockedStepPreview() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning-tint text-warning-strong">
          <Lock aria-hidden className="size-5" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">The hearing can&apos;t be scheduled yet</p>
            <Badge tone="warning">Minimum notice</Badge>
          </div>
          <p className="mt-1 text-sm text-ink">
            The employee must get at least 2 working days&apos; notice to prepare. The earliest fair
            date is Thu 26 Nov 2026.
          </p>
          <p className="mt-3 text-xs text-muted">
            Based on the Code of Good Practice: Dismissal (2025). Notice periods are settings your
            labour consultant can check.
          </p>
        </div>
      </div>
    </div>
  );
}

/** How consultant review looks on a case. */
export function ReviewPreview() {
  return (
    <div className="rounded-xl border border-line bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="font-semibold text-ink">Consultant review</p>
        <Badge tone="success">Approved</Badge>
      </div>
      <ol className="space-y-3 text-sm">
        <li className="flex gap-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-muted" />
          <p>
            <span className="font-medium">Owner sent the case for review</span>
            <span className="block text-xs text-muted">Mon 23 Nov, 09:15</span>
          </p>
        </li>
        <li className="flex gap-3">
          <MessageSquare aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
          <p>
            <span className="font-medium">Consultant requested changes</span>
            <span className="block text-muted">
              &ldquo;Add the dates of both late arrivals to the allegation.&rdquo;
            </span>
            <span className="block text-xs text-muted">Mon 23 Nov, 11:40</span>
          </p>
        </li>
        <li className="flex gap-3">
          <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
          <p>
            <span className="font-medium">Consultant approved the notice</span>
            <span className="block text-xs text-muted">Mon 23 Nov, 14:05</span>
          </p>
        </li>
      </ol>
    </div>
  );
}
