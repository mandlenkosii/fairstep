import { ChevronRight, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { EmptyIllustration } from "@/components/states/empty-state";
import { Stepper } from "@/components/stepper/stepper";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { REVIEW_STATUS } from "@/lib/cases/labels";
import { cn } from "@/lib/cn";
import { formatDateTime, initials } from "@/lib/format";
import { one } from "@/lib/supabase/one";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABEL, type IncidentCategory } from "@/lib/validation/incident";
import { buildStepperSteps, caseToWorkflow, STEP_LABEL } from "@/lib/workflow/view";

export const QUEUE_TABS = [
  ["pending_review", "Waiting for review"],
  ["changes_requested", "Changes requested"],
  ["approved", "Approved"],
  ["all", "All"],
] as const;
export type QueueTab = (typeof QUEUE_TABS)[number][0];

/**
 * The consultant's cases across their assigned businesses. RLS returns only
 * those businesses' cases; nothing here filters by business on purpose.
 */
export async function ReviewQueue({ tab, basePath }: { tab: QueueTab; basePath: string }) {
  const supabase = await createClient();
  const { data: cases, error } = await supabase
    .from("cases")
    .select(
      "id, reference, current_step, review_status, closed_at, complainant_name, chairperson_name, step_data, updated_at, business:businesses (name), employee:employees (first_name, last_name, job_title), incident:incidents (occurred_at, witnesses, category)",
    )
    .is("archived_at", null)
    .order("updated_at", { ascending: false });
  if (error) throw new Error("We couldn't load your cases. Please refresh the page.");

  const counts = Object.fromEntries(
    QUEUE_TABS.map(([key]) => [
      key,
      key === "all" ? cases.length : cases.filter((c) => c.review_status === key).length,
    ]),
  ) as Record<QueueTab, number>;
  const shown = tab === "all" ? cases : cases.filter((c) => c.review_status === tab);
  const now = new Date();

  return (
    <>
      <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
        {(
          [
            ["pending_review", "Waiting for you", "warning"],
            ["changes_requested", "With the owner to fix", "danger"],
            ["approved", "Approved", "success"],
          ] as const
        ).map(([key, label]) => (
          <Card key={key}>
            <p className="text-xs font-semibold text-muted sm:label-caps">{label}</p>
            <p className="mt-1 font-serif text-headline-lg font-semibold sm:mt-2 sm:text-display">
              {counts[key]}
            </p>
          </Card>
        ))}
      </div>

      <nav
        aria-label="Review status"
        className="mt-6 flex flex-wrap gap-1 rounded-lg bg-surface p-1 ring-1 ring-line sm:inline-flex"
      >
        {QUEUE_TABS.map(([key, label]) => (
          <Link
            key={key}
            href={`${basePath}?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-1 rounded-md px-3 text-sm font-semibold",
              tab === key ? "bg-primary-tint text-primary" : "text-muted hover:text-ink",
            )}
          >
            {label} <span className="font-normal">({counts[key]})</span>
          </Link>
        ))}
      </nav>

      {shown.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center py-12 text-center">
          <EmptyIllustration icon={ClipboardCheck} />
          <p className="mt-5 font-serif text-headline-sm font-semibold">
            {tab === "pending_review" ? "Nothing waiting for review" : "No cases here"}
          </p>
          <p className="mt-1 max-w-sm text-muted">
            When a client sends a case for review, it appears here.
          </p>
        </Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {shown.map((kase) => {
            const business = one(kase.business);
            const employee = one(kase.employee);
            const incident = one(kase.incident);
            const name = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
            const workflow = caseToWorkflow({ ...kase, incident });
            const review = REVIEW_STATUS[kase.review_status] ?? REVIEW_STATUS.not_requested;
            return (
              <li key={kase.id}>
                <Card className="relative lift hover:border-primary/40">
                  <div className="flex flex-wrap items-start gap-4">
                    <span
                      aria-hidden
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-tint font-semibold text-primary"
                    >
                      {initials(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="label-caps text-muted">{business?.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Link
                          href={`/consultant/cases/${kase.id}`}
                          className="font-semibold text-ink after:absolute after:inset-0 focus-visible:outline-none"
                        >
                          {name}
                        </Link>
                        <Badge tone="primary">{kase.reference}</Badge>
                        <Badge tone={review.tone}>{review.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {employee?.job_title} ·{" "}
                        {incident ? CATEGORY_LABEL[incident.category as IncidentCategory] : ""} ·{" "}
                        {workflow.currentStep === "closed"
                          ? "Closed"
                          : `Now: ${STEP_LABEL[workflow.currentStep]}`}{" "}
                        · Updated {formatDateTime(kase.updated_at)}
                      </p>
                    </div>
                    <ChevronRight aria-hidden className="size-5 text-muted" />
                  </div>
                  <Stepper steps={buildStepperSteps(workflow, now)} compact className="mt-4" />
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function parseTab(value: unknown, fallback: QueueTab): QueueTab {
  return QUEUE_TABS.some(([key]) => key === value) ? (value as QueueTab) : fallback;
}
