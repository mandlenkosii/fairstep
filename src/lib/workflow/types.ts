import type { STEP_ORDER } from "./rules.config";

export type Step = (typeof STEP_ORDER)[number];

export type Sanction = "none" | "verbal" | "written" | "final_written" | "dismissal";

export type PriorWarning = {
  kind: "written" | "final_written";
  /** SAST date the warning was given, e.g. "2025-11-03". */
  issuedOn: string;
};

/**
 * Everything the rules need to know about a case. The server builds this
 * from the database row; the rules never touch the database themselves.
 * Timestamps are ISO strings in UTC, as stored.
 */
export type WorkflowCase = {
  currentStep: Step;
  closedAt?: string | null;
  incidentOccurredAt?: string;
  people: {
    complainant?: string;
    investigator?: string;
    chairperson?: string;
    witnesses?: string[];
  };
  investigation?: { findings?: string };
  notice?: {
    allegations?: string[];
    deliveredAt?: string;
    hearingAt?: string;
    venue?: string;
    rights?: { representation: boolean; interpreter: boolean; witnesses: boolean };
  };
  hearing?: {
    employeeAttended?: boolean;
    employeeResponse?: string;
    /** Why there is no response, e.g. did not attend the postponed hearing. */
    noResponseReason?: string;
    postponements?: number;
  };
  outcome?: {
    sanction?: Sanction;
    reasons?: string;
    deliveredAt?: string;
    priorWarnings?: PriorWarning[];
  };
  appeal?: { lodgedAt?: string; decision?: string };
};

export type RuleCode =
  | "step_order"
  | "investigation_findings_missing"
  | "notice_not_delivered"
  | "notice_too_short"
  | "notice_incomplete"
  | "chairperson_missing"
  | "chairperson_not_impartial"
  | "employee_response_missing"
  | "postpone_first"
  | "outcome_missing"
  | "dismissal_reasons_missing"
  | "outcome_not_delivered"
  | "appeal_window_closed"
  | "appeal_decision_missing"
  | "expired_warning_counted"
  | "case_closed";

export type BlockedReason = { code: RuleCode; message: string };

export type TransitionResult = { ok: true } | { ok: false; reasons: BlockedReason[] };
