import { formatDayMonth, toSastDate } from "@/lib/workflow/dates";
import { canTransition, nextSteps } from "@/lib/workflow/rules";
import { STEP_ORDER } from "@/lib/workflow/rules.config";
import type { Step, WorkflowCase } from "@/lib/workflow/types";

/**
 * Owner dashboard logic, kept pure so it's tested.
 *
 * "Documented" is FairStep's impact metric (BUSINESS.md): a case counts when
 * every step it has passed has its details on record.
 */

const passed = (c: WorkflowCase, step: Step) =>
  c.currentStep === "closed" || STEP_ORDER.indexOf(c.currentStep) > STEP_ORDER.indexOf(step);

export function isDocumented(c: WorkflowCase): boolean {
  if (passed(c, "investigation") && !c.investigation?.findings?.trim()) return false;
  if (passed(c, "notice") && !(c.notice?.allegations?.length && c.notice.deliveredAt)) return false;
  if (passed(c, "hearing")) {
    const h = c.hearing;
    if (!h || h.employeeAttended === undefined) return false;
    if (!(h.employeeResponse?.trim() || h.noResponseReason?.trim())) return false;
  }
  if (passed(c, "outcome") && !c.outcome?.sanction) return false;
  return true;
}

/** Whole-number percentage of documented cases, or null when there are none. */
export function documentedPercent(cases: WorkflowCase[]): number | null {
  if (!cases.length) return null;
  return Math.round((cases.filter(isDocumented).length / cases.length) * 100);
}

export type DashboardCase = {
  id: string;
  reference: string;
  employeeName: string;
  reviewStatus: string;
  workflow: WorkflowCase;
};

export type AttentionItem = {
  kind: "changes" | "hearing" | "blocked";
  caseId: string;
  reference: string;
  title: string;
  detail: string;
  tone: "danger" | "warning" | "info";
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function sastTime(iso: string) {
  return new Date(new Date(iso).getTime() + 2 * 60 * 60 * 1000).toISOString().slice(11, 16);
}

/** Hearings in the next 7 days on open cases. */
export function upcomingHearings(cases: DashboardCase[], now: Date) {
  return cases
    .filter((c) => c.workflow.currentStep !== "closed" && c.workflow.notice?.hearingAt)
    .map((c) => ({ ...c, hearingAt: c.workflow.notice!.hearingAt! }))
    .filter((c) => {
      const at = new Date(c.hearingAt).getTime();
      return at >= now.getTime() && at <= now.getTime() + WEEK_MS;
    })
    .sort((a, b) => a.hearingAt.localeCompare(b.hearingAt));
}

/** What the owner should deal with first. */
export function attentionItems(cases: DashboardCase[], now: Date): AttentionItem[] {
  const open = cases.filter((c) => c.workflow.currentStep !== "closed" && !c.workflow.closedAt);

  const changes: AttentionItem[] = open
    .filter((c) => c.reviewStatus === "changes_requested")
    .map((c) => ({
      kind: "changes",
      caseId: c.id,
      reference: c.reference,
      title: "Your consultant asked for changes",
      detail: `${c.reference} · ${c.employeeName}`,
      tone: "danger",
    }));

  const hearings: AttentionItem[] = upcomingHearings(open, now).map((c) => ({
    kind: "hearing",
    caseId: c.id,
    reference: c.reference,
    title: `Hearing for ${c.employeeName}`,
    detail: `${formatDayMonth(toSastDate(c.hearingAt))} at ${sastTime(c.hearingAt)}`,
    tone: "warning",
  }));

  const blocked: AttentionItem[] = open.flatMap((c) => {
    const next = nextSteps(c.workflow.currentStep)[0];
    if (!next) return [];
    const result = canTransition(c.workflow, next, now);
    if (result.ok) return [];
    return [
      {
        kind: "blocked" as const,
        caseId: c.id,
        reference: c.reference,
        title: `${c.employeeName}: next step blocked`,
        detail: result.reasons[0].message,
        tone: "info" as const,
      },
    ];
  });

  // One item per case: the most urgent kind wins.
  const seen = new Set<string>();
  return [...changes, ...hearings, ...blocked].filter((item) => {
    if (seen.has(item.caseId)) return false;
    seen.add(item.caseId);
    return true;
  });
}
