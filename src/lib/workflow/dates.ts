import { SA_PUBLIC_HOLIDAYS } from "./rules.config";

/**
 * Date helpers for the workflow rules. Everything works on plain SAST
 * calendar dates ("2026-11-24") so that time zones can't shift a deadline.
 * South Africa is UTC+2 all year (no daylight saving).
 */

const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const HOLIDAYS = new Set(SA_PUBLIC_HOLIDAYS);
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** The SAST calendar day of a timestamp. A plain date is returned unchanged. */
export function toSastDate(value: string | Date): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const ms = new Date(value).getTime() + SAST_OFFSET_MS;
  return new Date(ms).toISOString().slice(0, 10);
}

// A calendar date as midnight UTC, so adding days never crosses a time zone.
function parse(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function format(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Monday to Friday, and not a South African public holiday. */
export function isWorkingDay(date: string): boolean {
  const weekday = parse(date).getUTCDay();
  return weekday !== 0 && weekday !== 6 && !HOLIDAYS.has(date);
}

/** The date that is `days` working days after `date` (the start day itself is not counted). */
export function addWorkingDays(date: string, days: number): string {
  let current = parse(date);
  let remaining = days;
  while (remaining > 0) {
    current = new Date(current.getTime() + DAY_MS);
    if (isWorkingDay(format(current))) remaining -= 1;
  }
  return format(current);
}

/** Adds calendar months, clamping to the last day of a shorter month (31 Aug + 6 = 28 Feb). */
export function addMonths(date: string, months: number): string {
  const start = parse(date);
  const target = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(start.getUTCDate(), lastDay));
  return format(target);
}

/** "Wed 26 Nov" */
export function formatDayMonth(date: string): string {
  const d = parse(date);
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "3 May 2026" */
export function formatFullDate(date: string): string {
  const d = parse(date);
  return `${d.getUTCDate()} ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
