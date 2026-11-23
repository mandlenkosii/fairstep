import type { Metadata } from "next";
import { AdminNotice } from "@/components/admin/admin-notice";
import { ConsultantControls } from "@/components/admin/assign-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { formatDate, initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Businesses" };

const PLAN_LABEL: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  consultant: "Consultant",
};

export default async function AdminBusinessesPage({
  searchParams,
}: PageProps<"/admin/businesses">) {
  await requireRole("admin");
  const { done, error } = await searchParams;
  const supabase = await createClient();
  const [{ data: businesses, error: loadError }, { data: consultants }] = await Promise.all([
    supabase.rpc("admin_business_overview"),
    supabase.from("profiles").select("id, full_name").eq("role", "consultant").order("full_name"),
  ]);
  if (loadError) throw new Error("We couldn’t load the businesses.");
  const people = consultants ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="text-headline-lg">Businesses</h1>
      <p className="mt-1 text-muted">
        {businesses?.length ?? 0} businesses. Numbers are counts only; no employee details are
        shown.
      </p>
      <AdminNotice done={done} error={error} />

      <ul className="mt-6 flex flex-col gap-4">
        {(businesses ?? []).map((b) => (
          <li key={b.business_id}>
            <Card className="grid gap-4 md:grid-cols-[1.4fr_1fr_1.4fr] md:items-start">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-tint font-semibold text-primary"
                >
                  {initials(b.name)}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-sm text-muted">
                    {[b.sector, b.province].filter(Boolean).join(" · ")}
                  </p>
                  <p className="text-xs text-muted">Joined {formatDate(b.created_at)}</p>
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-2 text-sm md:grid-cols-1">
                <div className="flex flex-col md:flex-row md:gap-2">
                  <dt className="text-muted">Plan</dt>
                  <dd>
                    <Badge tone="primary">{PLAN_LABEL[b.plan] ?? b.plan}</Badge>
                  </dd>
                </div>
                <div className="flex flex-col md:flex-row md:gap-2">
                  <dt className="text-muted">Employees</dt>
                  <dd className="font-semibold">{b.active_employees}</dd>
                </div>
                <div className="flex flex-col md:flex-row md:gap-2">
                  <dt className="text-muted">Open cases</dt>
                  <dd className="font-semibold">
                    {b.open_cases}
                    {b.pending_review > 0 && (
                      <span className="font-normal text-muted">
                        {" "}
                        ({b.pending_review} in review)
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
              <div>
                <p className="mb-1 text-sm text-muted">Consultant</p>
                <ConsultantControls
                  businessId={b.business_id}
                  businessName={b.name}
                  assigned={people.filter((p) => b.consultant_ids.includes(p.id))}
                  consultants={people}
                  returnTo="/admin/businesses"
                />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
