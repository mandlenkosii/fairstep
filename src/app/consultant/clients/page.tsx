import { Briefcase } from "lucide-react";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Clients" };

export default async function ConsultantClientsPage() {
  await requireRole("consultant");
  const supabase = await createClient();
  // RLS: only businesses assigned to this consultant come back.
  const [{ data: businesses }, { data: cases }] = await Promise.all([
    supabase.from("businesses").select("id, name, sector, province").order("name"),
    supabase.from("cases").select("business_id, review_status, closed_at").is("archived_at", null),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="text-headline-lg">Clients</h1>
      <p className="mt-1 text-muted">Businesses assigned to you by FairStep.</p>
      {!businesses?.length ? (
        <Card className="mt-6 flex flex-col items-center py-12 text-center">
          <Briefcase aria-hidden className="size-10 text-muted" />
          <p className="mt-3 font-semibold">No clients assigned yet</p>
          <p className="mt-1 text-muted">
            A FairStep admin links you to the businesses you advise.
          </p>
        </Card>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {businesses.map((business) => {
            const mine = (cases ?? []).filter((c) => c.business_id === business.id);
            const open = mine.filter((c) => !c.closed_at).length;
            const waiting = mine.filter((c) => c.review_status === "pending_review").length;
            return (
              <li key={business.id}>
                <Card className="flex items-start gap-4">
                  <span
                    aria-hidden
                    className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-tint font-semibold text-primary"
                  >
                    {initials(business.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{business.name}</p>
                    <p className="text-sm text-muted">
                      {[business.sector, business.province].filter(Boolean).join(" · ")}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>
                        {open} open {open === 1 ? "case" : "cases"}
                      </Badge>
                      {waiting > 0 && <Badge tone="warning">{waiting} waiting for you</Badge>}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
