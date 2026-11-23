import { toSastDate } from "@/lib/workflow/dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

/** "1 Mar 2019". Accepts a plain date or a UTC timestamp (shown as the SAST day). */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "–";
  const [year, month, day] = toSastDate(value).split("-").map(Number);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

/** "Mon 9 Nov 2026, 21:30" in SAST. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "–";
  const sast = new Date(new Date(value).getTime() + SAST_OFFSET_MS);
  const time = sast.toISOString().slice(11, 16);
  return `${WEEKDAYS[sast.getUTCDay()]} ${formatDate(value)}, ${time}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
