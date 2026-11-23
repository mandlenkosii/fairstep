import type { StepperStep } from "@/components/stepper/stepper";
import { formatDayMonth, toSastDate } from "./dates";
import { canTransition, nextSteps } from "./rules";
import { STEP_ORDER } from "./rules.config";
import type { Step, WorkflowCase } from "./types";

/** Plain names for the steps. */
export const STEP_LABEL: Record<Step, string> = {
  incident: "Incident",
  investigation: "Investigation",
  notice: "Notice of hearing",
  hearing: "Hearing",
  outcome: "Outcome",
  appeal: "Appeal",
  closed: "Closed",
};

/** The case columns the workflow needs, plus the incident it came from. */
export type CaseRow = {
  current_step: string;
  closed_at: string | null;
  complainant_name: string | null;
  chairperson_name: string | null;
  step_data: unknown;
  incident: { occurred_at: string; witnesses: string[] } | null;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** "Nomvula Zulu (Supervisor)" → "Nomvula Zulu", so rule R5 can compare names. */
function personName(entry: string) {
  return entry.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

/**
 * Turns a case row into the rules engine's input (see types.ts).
 * step_data holds investigation, notice, hearing, outcome and appeal details.
 */
export function caseToWorkflow(row: CaseRow): WorkflowCase {
  const data = isObject(row.step_data) ? row.step_data : {};
  const section = <T>(key: string) => (isObject(data[key]) ? (data[key] as T) : undefined);
  const investigation = section<WorkflowCase["investigation"] & { investigator?: string }>(
    "investigation",
  );

  return {
    currentStep: (STEP_ORDER as readonly string[]).includes(row.current_step)
      ? (row.current_step as Step)
      : "incident",
    closedAt: row.closed_at,
    incidentOccurredAt: row.incident?.occurred_at,
    people: {
      complainant: row.complainant_name ?? undefined,
      chairperson: row.chairperson_name ?? undefined,
      investigator: investigation?.investigator,
      witnesses: (row.incident?.witnesses ?? []).map(personName),
    },
    investigation,
    notice: section("notice"),
    hearing: section("hearing"),
    outcome: section("outcome"),
    appeal: section("appeal"),
  };
}

const SHOWN_STEPS = STEP_ORDER.filter((step) => step !== "closed");

function stepDetail(c: WorkflowCase, step: Step): string | undefined {
  switch (step) {
    case "incident":
      return c.incidentOccurredAt
        ? `Happened ${formatDayMonth(toSastDate(c.incidentOccurredAt))}`
        : undefined;
    case "investigation":
      return c.investigation?.findings ? "Findings recorded" : undefined;
    case "notice":
      return c.notice?.deliveredAt
        ? `Given ${formatDayMonth(toSastDate(c.notice.deliveredAt))}`
        : undefined;
    case "hearing":
      return c.notice?.hearingAt ? `${formatDayMonth(toSastDate(c.notice.hearingAt))}` : undefined;
    case "outcome":
      return c.outcome?.sanction ? "Outcome recorded" : undefined;
    default:
      return undefined;
  }
}

/**
 * Stepper steps for a case: done, current, blocked (with the rule's reason)
 * or upcoming. The next step is checked with canTransition, the same rules the
 * server enforces.
 */
export function buildStepperSteps(c: WorkflowCase, now: Date): StepperStep[] {
  const closed = c.currentStep === "closed" || Boolean(c.closedAt);
  const currentIndex = STEP_ORDER.indexOf(c.currentStep);
  const next = new Set(closed ? [] : nextSteps(c.currentStep));

  return SHOWN_STEPS.map((step) => {
    const base = {
      key: step,
      label: STEP_LABEL[step],
      detail: stepDetail(c, step),
      optional: step === "appeal",
    };
    if (closed) {
      if (step === "appeal" && !c.appeal?.lodgedAt) {
        return { ...base, status: "upcoming", detail: "Not used" };
      }
      return { ...base, status: "completed" };
    }
    const index = STEP_ORDER.indexOf(step);
    if (index < currentIndex) return { ...base, status: "completed" };
    if (index === currentIndex) return { ...base, status: "current" };
    if (next.has(step)) {
      const result = canTransition(c, step, now);
      if (!result.ok) return { ...base, status: "blocked", reason: result.reasons[0].message };
    }
    return { ...base, status: "upcoming" };
  });
}

/** Plain words for timeline events. */
export function eventLabel(type: string, payload: unknown): string {
  const data = isObject(payload) ? payload : {};
  switch (type) {
    case "case.opened":
      return "Opened the case";
    case "step.advanced": {
      const to = String(data.to ?? "");
      return `Moved the case to ${STEP_LABEL[to as Step] ?? "the next step"}`;
    }
    case "step.recorded": {
      const step = String(data.step ?? "");
      return `Recorded the ${(STEP_LABEL[step as Step] ?? "step").toLowerCase()} details`;
    }
    case "review.requested":
      return "Sent the case for review";
    case "review.approved":
      return "Approved the case";
    case "review.changes_requested":
      return "Requested changes";
    case "document.generated":
      return "Generated a document";
    default:
      return "Updated the case";
  }
}
