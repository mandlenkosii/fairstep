import { addMonths, addWorkingDays, formatDayMonth, formatFullDate, toSastDate } from "./dates";
import {
  APPEAL_WINDOW_WORKING_DAYS,
  FINAL_WARNING_VALID_MONTHS,
  MAX_POSTPONEMENTS_BEFORE_IN_ABSENTIA,
  MIN_NOTICE_WORKING_DAYS,
  STEP_ORDER,
  WRITTEN_WARNING_VALID_MONTHS,
} from "./rules.config";
import type { BlockedReason, PriorWarning, Step, TransitionResult, WorkflowCase } from "./types";

/**
 * FairStep's workflow rules (PRD R1–R11) as pure functions: same input, same
 * answer, no database and no clock (the caller passes `now`). The server action
 * calls `canTransition` before every step change, so the UI can't skip a rule.
 */

const hasText = (value?: string | null) => Boolean(value && value.trim());
const samePerson = (a?: string, b?: string) =>
  hasText(a) && hasText(b) && normaliseName(a!) === normaliseName(b!);
function normaliseName(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/** The steps a case can move to next. Appeal is optional, so an outcome can go straight to closed. */
export function nextSteps(step: Step): Step[] {
  if (step === "outcome") return ["appeal", "closed"];
  const index = STEP_ORDER.indexOf(step);
  const next = STEP_ORDER[index + 1];
  return next ? [next] : [];
}

/** R3: the first day a hearing can fairly take place. */
export function earliestHearingDate(noticeDeliveredAt: string): string {
  return addWorkingDays(toSastDate(noticeDeliveredAt), MIN_NOTICE_WORKING_DAYS);
}

/** R9: the last day the employee can lodge an appeal. */
export function appealDeadline(outcomeDeliveredAt: string): string {
  return addWorkingDays(toSastDate(outcomeDeliveredAt), APPEAL_WINDOW_WORKING_DAYS);
}

/** R10: the last day a prior warning can be counted. */
export function warningExpiry(warning: PriorWarning): string {
  const months =
    warning.kind === "final_written" ? FINAL_WARNING_VALID_MONTHS : WRITTEN_WARNING_VALID_MONTHS;
  return addMonths(warning.issuedOn, months);
}

function isClosed(c: WorkflowCase) {
  return c.currentStep === "closed" || Boolean(c.closedAt);
}

/** R11: case facts can't change once a case is closed (comments are still allowed). */
export function canEditCase(c: WorkflowCase): boolean {
  return !isClosed(c);
}

// R1: what has to happen before each step, in the owner's words.
const STEP_ORDER_MESSAGES: Record<Step, string> = {
  incident: "This case is already past that step.",
  investigation: "Log the incident before you start an investigation.",
  notice: "Finish the investigation before you issue a notice of hearing.",
  hearing: "You need to issue a notice of hearing before the hearing can take place.",
  outcome: "Finish the hearing step before you record the outcome.",
  appeal: "Record the outcome before an appeal can be lodged.",
  closed: "Record the outcome before you close the case.",
};

function checkStepOrder(c: WorkflowCase, to: Step): BlockedReason[] {
  if (nextSteps(c.currentStep).includes(to)) return [];
  const goingBack = STEP_ORDER.indexOf(to) <= STEP_ORDER.indexOf(c.currentStep);
  return [
    {
      code: "step_order",
      message: goingBack ? STEP_ORDER_MESSAGES.incident : STEP_ORDER_MESSAGES[to],
    },
  ];
}

// R2
function checkInvestigation(c: WorkflowCase): BlockedReason[] {
  if (hasText(c.investigation?.findings)) return [];
  return [
    {
      code: "investigation_findings_missing",
      message: "Record what you found in your investigation first, so the allegations are clear.",
    },
  ];
}

// R4 and R3
function checkNotice(c: WorkflowCase): BlockedReason[] {
  const notice = c.notice ?? {};
  const reasons: BlockedReason[] = [];
  const rights = notice.rights;

  const complete =
    (notice.allegations ?? []).some(hasText) &&
    hasText(notice.hearingAt) &&
    hasText(notice.venue) &&
    Boolean(rights?.representation && rights.interpreter && rights.witnesses);
  if (!complete) {
    reasons.push({
      code: "notice_incomplete",
      message:
        "The notice must list the allegations, the hearing date, time and venue, and the employee's rights.",
    });
  }

  if (!hasText(notice.deliveredAt)) {
    reasons.push({
      code: "notice_not_delivered",
      message: "Record when the notice was given to the employee before the hearing.",
    });
  } else if (hasText(notice.hearingAt)) {
    const earliest = earliestHearingDate(notice.deliveredAt!);
    if (toSastDate(notice.hearingAt!) < earliest) {
      reasons.push({
        code: "notice_too_short",
        message: `The employee must get at least ${MIN_NOTICE_WORKING_DAYS} working days to prepare. The earliest fair date is ${formatDayMonth(earliest)}.`,
      });
    }
  }
  return reasons;
}

// R5
function checkChairperson(c: WorkflowCase): BlockedReason[] {
  const { chairperson, complainant, investigator, witnesses = [] } = c.people;
  if (!hasText(chairperson)) {
    return [
      {
        code: "chairperson_missing",
        message:
          "Choose a chairperson for the hearing: someone who wasn't involved in the incident.",
      },
    ];
  }

  let role: string | null = null;
  if (samePerson(chairperson, complainant)) role = "the complainant";
  else if (samePerson(chairperson, investigator)) role = "the investigator";
  else if (witnesses.some((witness) => samePerson(chairperson, witness))) role = "a witness";
  if (!role) return [];

  return [
    {
      code: "chairperson_not_impartial",
      message: `The chairperson can't also be ${role}. Choose someone who wasn't involved.`,
    },
  ];
}

// R7 and R6
function checkHearing(c: WorkflowCase): BlockedReason[] {
  const hearing = c.hearing ?? {};
  const missingResponse: BlockedReason = {
    code: "employee_response_missing",
    message: "Record the employee's side of the story before deciding the outcome.",
  };

  if (hearing.employeeAttended === false) {
    if ((hearing.postponements ?? 0) < MAX_POSTPONEMENTS_BEFORE_IN_ABSENTIA) {
      return [
        {
          code: "postpone_first",
          message: "Postpone once and re-notify the employee before continuing without them.",
        },
      ];
    }
    return hasText(hearing.noResponseReason) ? [] : [missingResponse];
  }
  return hasText(hearing.employeeResponse) ? [] : [missingResponse];
}

// R8 and R10
function checkOutcome(c: WorkflowCase): BlockedReason[] {
  const outcome = c.outcome;
  if (!outcome?.sanction) {
    return [{ code: "outcome_missing", message: "Record the outcome of the hearing first." }];
  }

  const reasons: BlockedReason[] = [];
  if (outcome.sanction === "dismissal" && !hasText(outcome.reasons)) {
    reasons.push({
      code: "dismissal_reasons_missing",
      message: "Explain why dismissal is appropriate, including any prior valid warnings.",
    });
  }

  // A warning counts if it was still valid on the day of the new incident.
  const offenceDate = c.incidentOccurredAt ? toSastDate(c.incidentOccurredAt) : null;
  for (const warning of outcome.priorWarnings ?? []) {
    const expiry = warningExpiry(warning);
    if (offenceDate && offenceDate > expiry) {
      reasons.push({
        code: "expired_warning_counted",
        message: `This warning expired on ${formatFullDate(expiry)} and can't be counted.`,
      });
    }
  }
  return reasons;
}

// R9
function checkAppealWindow(c: WorkflowCase, now: Date): BlockedReason[] {
  if (!hasText(c.outcome?.deliveredAt)) {
    return [
      {
        code: "outcome_not_delivered",
        message:
          "Record when the outcome was given to the employee. The appeal period starts then.",
      },
    ];
  }
  const deadline = appealDeadline(c.outcome!.deliveredAt!);
  const lodged = toSastDate(c.appeal?.lodgedAt ?? now);
  if (lodged <= deadline) return [];
  return [
    {
      code: "appeal_window_closed",
      message: `The appeal period ended on ${formatDayMonth(deadline)}.`,
    },
  ];
}

function checkAppealDecision(c: WorkflowCase): BlockedReason[] {
  if (hasText(c.appeal?.decision)) return [];
  return [
    {
      code: "appeal_decision_missing",
      message: "Record the appeal decision before you close the case.",
    },
  ];
}

/**
 * Can this case move from its current step to `to`?
 * Returns every reason it can't, so the owner can fix them all at once.
 */
export function canTransition(c: WorkflowCase, to: Step, now: Date): TransitionResult {
  if (isClosed(c)) {
    return {
      ok: false,
      reasons: [
        {
          code: "case_closed",
          message: "This case is closed. Add a note instead of changing the record.",
        },
      ],
    };
  }

  const order = checkStepOrder(c, to);
  if (order.length) return { ok: false, reasons: order };

  let reasons: BlockedReason[] = [];
  switch (to) {
    case "notice":
      reasons = checkInvestigation(c);
      break;
    case "hearing":
      reasons = [...checkNotice(c), ...checkChairperson(c)];
      break;
    case "outcome":
      reasons = [...checkHearing(c), ...checkChairperson(c)];
      break;
    case "appeal":
      reasons = [...checkOutcome(c), ...checkAppealWindow(c, now)];
      break;
    case "closed":
      reasons = c.currentStep === "appeal" ? checkAppealDecision(c) : checkOutcome(c);
      break;
  }

  return reasons.length ? { ok: false, reasons } : { ok: true };
}
