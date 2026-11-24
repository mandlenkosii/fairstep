import { toSastDate } from "@/lib/workflow/dates";

/**
 * A GitHub-style grid of how much was put on record each day (incidents and
 * case events), so the owner can see their record-keeping at a glance.
 */

export type ActivityDay = { date: string; count: number; future: boolean };

const DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date: string, days: number) {
  return new Date(new Date(`${date}T00:00:00Z`).getTime() + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function activityGrid(timestamps: string[], now: Date, weeks: number) {
  const today = toSastDate(now);
  const weekday = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  const start = addDays(today, -weekday - (weeks - 1) * 7);

  const counts = new Map<string, number>();
  for (const timestamp of timestamps) {
    const day = toSastDate(timestamp);
    if (day >= start && day <= today) counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  const grid: ActivityDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const week: ActivityDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      week.push({ date, count: counts.get(date) ?? 0, future: date > today });
    }
    grid.push(week);
  }
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  const max = Math.max(0, ...counts.values());
  return { weeks: grid, total, max };
}

/** 0 = nothing, 1–4 = lighter to darker teal, relative to the busiest day. */
export function activityLevel(count: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0 || max <= 0) return 0;
  const ratio = count / max;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}
