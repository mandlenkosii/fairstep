import { AlertTriangle, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { STEP_ORDER } from "@/lib/workflow/rules.config";
import { STEP_LABEL } from "@/lib/workflow/view";

export const metadata: Metadata = { title: "Admin overview" };

type Stats = {
  businesses: number;
  owners: number;
  consultants: number;
  admins: number;
  open_cases: number;
  closed_cases: number;
  incidents_30_days: number;
  cases_by_step: Record<string, number>;
  cases_by_review: Record<string, number>;
  avg_review_hours: number | null;
};

export default async function AdminOverviewPage() {
  const user = await requireRole("admin");
  const supabase = await createClient();
  // Counts only: these database functions refuse non-admins and return no personal details.
  const [{ data, error }, { data: businesses }] = await Promise.all([
    supabase.rpc("admin_platform_stats"),
    supabase.rpc("admin_business_overview"),
  ]);
  if (error || !data) throw new Error("We couldn’t load the platform statistics.");
  const stats = data as unknown as Stats;
  const unassigned = (businesses ?? []).filter((b) => b.consultant_ids.length === 0);
  const maxStep = Math.max(1, ...Object.values(stats.cases_by_step));
  const turnaround =
    stats.avg_review_hours === null
      ? "–"
      : stats.avg_review_hours >= 24
        ? `${(stats.avg_review_hours / 24).toFixed(1)} days`
        : `${stats.avg_review_hours} hours`;

  const tiles: [string, string | number, string][] = [
    [
      "Businesses",
      stats.businesses,
      `${stats.owners} owner ${stats.owners === 1 ? "login" : "logins"}`,
    ],
    ["Open cases", stats.open_cases, `${stats.closed_cases} closed`],
    [
      "Waiting for review",
      stats.cases_by_review.pending_review ?? 0,
      `${stats.consultants} ${stats.consultants === 1 ? "consultant" : "consultants"}`,
    ],
    ["Review turnaround", turnaround, "Average, sent → decision"],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="text-headline-lg">Platform overview</h1>
      <p className="mt-1 text-muted">Welcome, {user.fullName.split(" ")[0]}.</p>

      <p className="mt-4 flex gap-2 rounded-lg bg-info-tint px-3 py-2 text-sm text-ink">
        <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-info" />
        You see counts only. Employee details and case contents stay private to each business and
        its consultant (POPIA).
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {tiles.map(([label, value, hint]) => (
          <Card key={label}>
            <p className="text-xs font-semibold text-muted sm:label-caps">{label}</p>
            <p className="mt-1 font-serif text-headline-lg font-semibold sm:text-display">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted sm:text-sm">{hint}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Cases by step</CardTitle>
          <ul className="mt-4 flex flex-col gap-3">
            {STEP_ORDER.map((step) => {
              const n = stats.cases_by_step[step] ?? 0;
              return (
                <li
                  key={step}
                  className="grid grid-cols-[8rem_1fr_2rem] items-center gap-3 text-sm"
                >
                  <span>{STEP_LABEL[step]}</span>
                  <span className="h-2 rounded-full bg-paper" aria-hidden>
                    <span
                      className="block h-2 rounded-full bg-primary"
                      style={{ width: `${(n / maxStep) * 100}%` }}
                    />
                  </span>
                  <span className="text-right font-semibold">{n}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm text-muted">
            {stats.incidents_30_days} incidents logged in the last 30 days.
          </p>
        </Card>

        <Card>
          <CardTitle>Businesses without a consultant</CardTitle>
          {unassigned.length ? (
            <ul className="mt-4 flex flex-col gap-3">
              {unassigned.map((b) => (
                <li
                  key={b.business_id}
                  className="flex items-center justify-between gap-3 rounded-lg bg-warning-tint p-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle aria-hidden className="size-4 text-warning-strong" />
                    <span className="font-semibold">{b.name}</span>
                    <span className="text-muted">· {b.open_cases} open</span>
                  </span>
                  <Link
                    href="/admin/businesses"
                    className="inline-flex min-h-11 items-center font-semibold text-primary underline-offset-2 hover:underline"
                  >
                    Assign
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">Every business has a consultant.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
