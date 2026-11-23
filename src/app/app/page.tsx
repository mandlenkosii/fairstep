import {
  AlertCircle,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  Flag,
  FolderOpen,
  Lock,
  Plus,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Stepper } from "@/components/stepper/stepper";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { requireOwnerBusiness } from "@/lib/auth/session";
import {
  attentionItems,
  documentedPercent,
  upcomingHearings,
  type AttentionItem,
  type DashboardCase,
} from "@/lib/cases/dashboard";
import { REVIEW_STATUS } from "@/lib/cases/labels";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { one } from "@/lib/supabase/one";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABEL, type IncidentCategory } from "@/lib/validation/incident";
import { formatDayMonth, toSastDate } from "@/lib/workflow/dates";
import { buildStepperSteps, caseToWorkflow, STEP_LABEL } from "@/lib/workflow/view";

export const metadata: Metadata = { title: "Dashboard" };

const ICON: Record<AttentionItem["kind"], typeof AlertCircle> = {
  changes: AlertCircle,
  hearing: CalendarClock,
  blocked: Lock,
};
const TONE: Record<AttentionItem["tone"], string> = {
  danger: "bg-danger-tint text-danger",
  warning: "bg-warning-tint text-warning-strong",
  info: "bg-info-tint text-info",
};

function greeting(now: Date) {
  const hour = (now.getUTCHours() + 2) % 24;
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function OwnerDashboardPage() {
  // Checked again here: layouts don't re-run on every navigation.
  const { user, business } = await requireOwnerBusiness();
  const supabase = await createClient();
  const [{ data: rows }, { data: incidents }, { count: employeeCount }] = await Promise.all([
    supabase
      .from("cases")
      .select(
        "id, reference, current_step, review_status, closed_at, complainant_name, chairperson_name, step_data, employee:employees (first_name, last_name), incident:incidents (occurred_at, witnesses, category)",
      )
      .eq("business_id", business.id)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
    supabase
      .from("incidents")
      .select(
        "id, occurred_at, category, employee:employees (first_name, last_name), cases (id, reference)",
      )
      .eq("business_id", business.id)
      .is("archived_at", null)
      .order("occurred_at", { ascending: false })
      .limit(5),
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "active"),
  ]);

  const now = new Date();
  const cases: (DashboardCase & { category: string })[] = (rows ?? []).map((row) => {
    const employee = one(row.employee);
    const incident = one(row.incident);
    return {
      id: row.id,
      reference: row.reference,
      reviewStatus: row.review_status,
      employeeName: employee ? `${employee.first_name} ${employee.last_name}` : "Employee",
      category: incident ? CATEGORY_LABEL[incident.category as IncidentCategory] : "",
      workflow: caseToWorkflow({ ...row, incident }),
    };
  });
  const open = cases.filter((c) => c.workflow.currentStep !== "closed");
  const waiting = open.filter((c) => c.reviewStatus === "pending_review").length;
  const hearings = upcomingHearings(open, now);
  const documented = documentedPercent(cases.map((c) => c.workflow));
  const attention = attentionItems(cases, now).slice(0, 5);
  const today = formatDayMonth(toSastDate(now));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-muted">
            {today} · {business.name}
          </p>
          <h1 className="mt-1 text-headline-lg">
            {greeting(now)}, {user.fullName.split(" ")[0]}
          </h1>
        </div>
        <ButtonLink href="/app/incidents/new">
          <Plus aria-hidden className="size-4" />
          Log an incident
        </ButtonLink>
      </div>

      {!employeeCount ? (
        <Card className="mt-8">
          <CardTitle>Get started in two steps</CardTitle>
          <ol className="mt-4 flex flex-col gap-4">
            <li className="flex flex-wrap items-center justify-between gap-3">
              <span>
                <span className="font-semibold">1. Add your employees.</span>{" "}
                <span className="text-muted">Name, job title and start date are enough.</span>
              </span>
              <ButtonLink href="/app/employees/new" variant="secondary">
                <UserPlus aria-hidden className="size-4" />
                Add employee
              </ButtonLink>
            </li>
            <li className="flex flex-wrap items-center justify-between gap-3">
              <span>
                <span className="font-semibold">2. Log incidents the day they happen.</span>{" "}
                <span className="text-muted">
                  FairStep guides you from there, one fair step at a time.
                </span>
              </span>
            </li>
          </ol>
        </Card>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <Tile icon={FolderOpen} label="Open cases" value={open.length}>
              {waiting ? `${waiting} with your consultant` : "None waiting for review"}
            </Tile>
            <Tile icon={ClipboardCheck} label="Waiting for review" value={waiting}>
              {waiting ? "Your consultant is checking" : "Nothing sent"}
            </Tile>
            <Tile icon={CalendarClock} label="Hearings this week" value={hearings.length}>
              {hearings[0]
                ? `${formatDayMonth(toSastDate(hearings[0].hearingAt))} · ${hearings[0].employeeName}`
                : "None in the next 7 days"}
            </Tile>
            <Tile
              icon={ShieldCheck}
              label="Cases documented"
              value={documented === null ? "–" : `${documented}%`}
            >
              <span className="mt-2 block h-1.5 rounded-full bg-paper" aria-hidden>
                <span
                  className="block h-1.5 rounded-full bg-success"
                  style={{ width: `${documented ?? 0}%` }}
                />
              </span>
              <span className="mt-1 block">Every step so far on record</span>
            </Tile>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Needs your attention</CardTitle>
                  {attention.length > 0 && (
                    <Badge tone="danger">
                      {attention.length} {attention.length === 1 ? "item" : "items"}
                    </Badge>
                  )}
                </div>
                {attention.length ? (
                  <ul className="mt-4 flex flex-col gap-3">
                    {attention.map((item) => {
                      const Icon = ICON[item.kind];
                      return (
                        <li key={`${item.kind}-${item.caseId}`}>
                          <Link
                            href={`/app/cases/${item.caseId}`}
                            className="flex items-start gap-3 rounded-xl bg-paper p-3 hover:bg-primary-tint"
                          >
                            <span
                              className={cn(
                                "flex size-10 shrink-0 items-center justify-center rounded-lg",
                                TONE[item.tone],
                              )}
                            >
                              <Icon aria-hidden className="size-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-semibold">{item.title}</span>
                              <span className="block text-sm text-muted">{item.detail}</span>
                            </span>
                            <ChevronRight aria-hidden className="mt-2 size-5 text-muted" />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-muted">You’re up to date. Nothing needs you right now.</p>
                )}
              </Card>

              <Card>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Active cases</CardTitle>
                  <Link
                    href="/app/cases"
                    className="text-sm font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    All cases
                  </Link>
                </div>
                {open.length ? (
                  <ul className="mt-4 flex flex-col gap-5">
                    {open.slice(0, 4).map((c) => {
                      const review = REVIEW_STATUS[c.reviewStatus] ?? REVIEW_STATUS.not_requested;
                      return (
                        <li key={c.id}>
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/app/cases/${c.id}`}
                              className="font-semibold text-ink underline-offset-2 hover:underline"
                            >
                              {c.employeeName}
                            </Link>
                            <span className="text-sm text-muted">{c.reference}</span>
                            <Badge tone={review.tone}>{review.label}</Badge>
                          </div>
                          <p className="text-sm text-muted">
                            {c.category} · Now: {STEP_LABEL[c.workflow.currentStep]}
                          </p>
                          <div className="mt-3 rounded-xl bg-paper p-3">
                            <Stepper steps={buildStepperSteps(c.workflow, now)} compact />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-2 text-muted">No open cases.</p>
                )}
              </Card>
            </div>

            <Card className="self-start">
              <CardTitle className="flex items-center gap-2">
                <Flag aria-hidden className="size-5" />
                Recent incidents
              </CardTitle>
              {incidents?.length ? (
                <ul className="mt-4 flex flex-col divide-y divide-line">
                  {incidents.map((incident) => {
                    const employee = one(incident.employee);
                    const kase = one(incident.cases);
                    return (
                      <li key={incident.id} className="py-3 first:pt-0">
                        <Link
                          href={`/app/incidents/${incident.id}`}
                          className="font-semibold underline-offset-2 hover:underline"
                        >
                          {CATEGORY_LABEL[incident.category as IncidentCategory]}
                        </Link>
                        <p className="text-sm text-muted">
                          {employee ? `${employee.first_name} ${employee.last_name}` : ""} ·{" "}
                          {formatDateTime(incident.occurred_at)}
                        </p>
                        <p className="mt-1 text-sm">
                          {kase ? (
                            <Badge tone="primary">{kase.reference}</Badge>
                          ) : (
                            <span className="text-muted">No case</span>
                          )}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-muted">No incidents logged yet.</p>
              )}
              <ButtonLink href="/app/incidents" variant="secondary" className="mt-4 w-full">
                All incidents
              </ButtonLink>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: typeof AlertCircle;
  label: string;
  value: string | number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-muted sm:label-caps">{label}</p>
        <Icon aria-hidden className="hidden size-5 text-primary sm:block" />
      </div>
      <p className="mt-1 font-serif text-headline-lg font-semibold sm:mt-2 sm:text-display">
        {value}
      </p>
      <div className="mt-1 text-xs text-muted sm:text-sm">{children}</div>
    </Card>
  );
}
