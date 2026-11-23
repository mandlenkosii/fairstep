/**
 * Settings for FairStep's disciplinary workflow rules (PRD rules R1–R11).
 *
 * These are based on the Code of Good Practice: Dismissal (2025). They are
 * process guidance, not legal advice: a qualified labour practitioner must
 * check each value before FairStep is used in production.
 */

// Verify with a qualified labour practitioner
/** R1: the steps of a case, in order. Appeal is optional: a case can close straight after the outcome. */
export const STEP_ORDER = [
  "incident",
  "investigation",
  "notice",
  "hearing",
  "outcome",
  "appeal",
  "closed",
] as const;

// Verify with a qualified labour practitioner
/** R3: working days the employee gets to prepare, counted from the day after the notice is delivered. */
export const MIN_NOTICE_WORKING_DAYS = 2;

// Verify with a qualified labour practitioner
/** R7: how many times a hearing must be postponed after a no-show before it can go ahead without the employee. */
export const MAX_POSTPONEMENTS_BEFORE_IN_ABSENTIA = 1;

// Verify with a qualified labour practitioner
/** R9: working days the employee has to appeal, counted from the day after the outcome is delivered. */
export const APPEAL_WINDOW_WORKING_DAYS = 5;

// Verify with a qualified labour practitioner
/** R10: how long a written warning can be counted as a prior offence. */
export const WRITTEN_WARNING_VALID_MONTHS = 6;

// Verify with a qualified labour practitioner
/** R10: how long a final written warning can be counted as a prior offence. */
export const FINAL_WARNING_VALID_MONTHS = 12;

// Verify with a qualified labour practitioner
/**
 * South African public holidays (Public Holidays Act), as SAST dates.
 * A holiday on a Sunday moves to the Monday; those Mondays are listed.
 * Add each new year before it starts.
 */
export const SA_PUBLIC_HOLIDAYS: readonly string[] = [
  // 2025
  "2025-01-01",
  "2025-03-21",
  "2025-04-18", // Good Friday
  "2025-04-21", // Family Day
  "2025-04-28", // Freedom Day (27 Apr was a Sunday)
  "2025-05-01",
  "2025-06-16",
  "2025-08-09",
  "2025-09-24",
  "2025-12-16",
  "2025-12-25",
  "2025-12-26",
  // 2026
  "2026-01-01",
  "2026-03-21",
  "2026-04-03", // Good Friday
  "2026-04-06", // Family Day
  "2026-04-27",
  "2026-05-01",
  "2026-06-16",
  "2026-08-10", // National Women's Day (9 Aug is a Sunday)
  "2026-09-24",
  "2026-12-16",
  "2026-12-25",
  "2026-12-26",
  // 2027
  "2027-01-01",
  "2027-03-22", // Human Rights Day (21 Mar is a Sunday)
  "2027-03-26", // Good Friday
  "2027-03-29", // Family Day
  "2027-04-27",
  "2027-05-01",
  "2027-06-16",
  "2027-08-09",
  "2027-09-24",
  "2027-12-16",
  "2027-12-25",
  "2027-12-27", // Day of Goodwill (26 Dec is a Sunday)
];
