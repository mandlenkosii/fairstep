import { ChevronRight, Flag, Gavel } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Stepper } from "@/components/stepper/stepper";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireOwnerBusiness } from "@/lib/auth/session";
import { REVIEW_STATUS } from "@/lib/cases/labels";
import { cn } from "@/lib/cn";
import { formatDate, initials } from "@/lib/format";
import { one } from "@/lib/supabase/one";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABEL, type IncidentCategory } from "@/lib/validation/incident";
import { buildStepperSteps, caseToWorkflow, STEP_LABEL } from "@/lib/workflow/view";

export const metadata: Metadata = { title: "Cases" };

export default async function CasesPage({ searchParams }: PageProps<"/app/cases">) {
  const { business } = await requireOwnerBusiness();
  const { status } = await searchParams;
  const showClosed = status === "closed";

  const supabase = await createClient();
  let request = supabase
    .from("cases")
    .select(
      "id, reference, current_step, review_status, closed_at, complainant_name, chairperson_name, step_data, created_at, employee:employees (first_name, last_name, job_title), incident:incidents (occurred_at, witnesses, category)",
    )
    .eq("business_id", business.id)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  request = showClosed ? request.not("closed_at", "is", null) : request.is("closed_at", null);
  const { data: cases, error } = await request;
  if (error) throw new Error("We couldn't load your cases. Please refresh the page.");

  const now = new Date();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg">Cases</h1>
          <p className="mt-1 text-muted">
            Every disciplinary case at {business.name}, guided step by step.
          </p>
        </div>
        <ButtonLink href="/app/incidents" variant="secondary">
          <Flag aria-hidden className="size-4" />
          Start from an incident
        </ButtonLink>
      </div>

      <nav
        aria-label="Case status"
        className="mt-6 inline-flex gap-1 rounded-lg bg-surface p-1 ring-1 ring-line"
      >
        {[
          ["open", "/app/cases"],
          ["closed", "/app/cases?status=closed"],
        ].map(([label, href]) => {
          const active = (label === "closed") === showClosed;
          return (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-semibold capitalize",
                active ? "bg-primary-tint text-primary" : "text-muted hover:text-ink",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {cases.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center py-12 text-center">
          <Gavel aria-hidden className="size-10 text-muted" />
          <p className="mt-3 font-semibold">{showClosed ? "No closed cases" : "No open cases"}</p>
          {!showClosed && (
            <p className="mt-1 max-w-sm text-muted">
              A case starts from an incident. Open an incident and choose “Start a disciplinary
              case”.
            </p>
          )}
        </Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {cases.map((kase) => {
            const employee = one(kase.employee);
            const incident = one(kase.incident);
            const name = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";
            const workflow = caseToWorkflow({ ...kase, incident });
            const review = REVIEW_STATUS[kase.review_status] ?? REVIEW_STATUS.not_requested;
            return (
              <li key={kase.id}>
                <Card className="relative hover:border-primary/40">
                  <div className="flex flex-wrap items-start gap-4">
                    <span
                      aria-hidden
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-tint font-semibold text-primary"
                    >
                      {initials(name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/app/cases/${kase.id}`}
                          className="font-semibold text-ink after:absolute after:inset-0 focus-visible:outline-none"
                        >
                          {name}
                        </Link>
                        <Badge tone="primary">{kase.reference}</Badge>
                        <Badge tone={review.tone}>{review.label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {incident ? CATEGORY_LABEL[incident.category as IncidentCategory] : ""} ·
                        Opened {formatDate(kase.created_at)} ·{" "}
                        {workflow.currentStep === "closed"
                          ? "Closed"
                          : `Now: ${STEP_LABEL[workflow.currentStep]}`}
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
    </div>
  );
}
