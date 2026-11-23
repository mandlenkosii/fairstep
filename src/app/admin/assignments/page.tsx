import { Link2 } from "lucide-react";
import type { Metadata } from "next";
import { unassignConsultant } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { one } from "@/lib/supabase/one";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Consultant assignments" };

export default async function AdminAssignmentsPage({
  searchParams,
}: PageProps<"/admin/assignments">) {
  await requireRole("admin");
  const { done, error } = await searchParams;
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("consultant_assignments")
    .select(
      "business_id, consultant_id, created_at, business:businesses (name), consultant:profiles!consultant_assignments_consultant_id_fkey (full_name), by:profiles!consultant_assignments_assigned_by_fkey (full_name)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="text-headline-lg">Consultant assignments</h1>
      <p className="mt-1 text-muted">
        Who advises which business. Assign consultants from the Businesses page.
      </p>
      <AdminNotice done={done} error={error} />
      {!assignments?.length ? (
        <Card className="mt-6 flex flex-col items-center py-12 text-center">
          <Link2 aria-hidden className="size-10 text-muted" />
          <p className="mt-3 font-semibold">No assignments yet</p>
        </Card>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {assignments.map((a) => (
            <li key={`${a.business_id}-${a.consultant_id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {one(a.consultant)?.full_name} → {one(a.business)?.name}
                  </p>
                  <p className="text-sm text-muted">
                    Assigned {formatDate(a.created_at)}
                    {one(a.by)?.full_name ? ` by ${one(a.by)?.full_name}` : ""}
                  </p>
                </div>
                <form
                  action={unassignConsultant.bind(
                    null,
                    "/admin/assignments",
                    a.business_id,
                    a.consultant_id,
                  )}
                >
                  <Button type="submit" variant="ghost">
                    Remove
                  </Button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
