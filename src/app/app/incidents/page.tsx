import { ChevronRight, Flag, Paperclip, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireOwnerBusiness } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { one } from "@/lib/supabase/one";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABEL, type IncidentCategory } from "@/lib/validation/incident";

export const metadata: Metadata = { title: "Incidents" };

export default async function IncidentsPage() {
  const { business } = await requireOwnerBusiness();
  const supabase = await createClient();
  const { data: incidents, error } = await supabase
    .from("incidents")
    .select(
      "id, occurred_at, category, location, employees (first_name, last_name), cases (id, reference), documents (id)",
    )
    .eq("business_id", business.id)
    .is("archived_at", null)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error("We couldn't load your incidents. Please refresh the page.");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg">Incidents</h1>
          <p className="mt-1 text-muted">Everything logged at {business.name}, newest first.</p>
        </div>
        <ButtonLink href="/app/incidents/new">
          <Plus aria-hidden className="size-4" />
          Log an incident
        </ButtonLink>
      </div>

      {incidents.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center py-12 text-center">
          <Flag aria-hidden className="size-10 text-muted" />
          <p className="mt-3 font-semibold">No incidents logged</p>
          <p className="mt-1 max-w-sm text-muted">
            When something happens at work, log it the same day. Most incidents never become a case,
            but the record protects you if one does.
          </p>
          <ButtonLink href="/app/incidents/new" className="mt-5">
            <Plus aria-hidden className="size-4" />
            Log your first incident
          </ButtonLink>
        </Card>
      ) : (
        <Card className="mt-6 overflow-hidden p-0 sm:p-0">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Incidents</caption>
            <thead className="hidden border-b border-line bg-paper md:table-header-group">
              <tr className="label-caps text-muted">
                <th scope="col" className="px-6 py-3 font-semibold">
                  When
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  Case
                </th>
                <th scope="col" className="px-6 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {incidents.map((incident) => {
                const employee = one(incident.employees);
                const kase = one(incident.cases);
                const evidence = incident.documents?.length ?? 0;
                return (
                  <tr key={incident.id} className="relative hover:bg-paper">
                    <td className="px-4 py-4 md:px-6">
                      <Link
                        href={`/app/incidents/${incident.id}`}
                        className="font-semibold text-ink after:absolute after:inset-0 focus-visible:outline-none"
                      >
                        {formatDateTime(incident.occurred_at)}
                      </Link>
                      <p className="text-muted md:hidden">
                        {employee ? `${employee.first_name} ${employee.last_name}` : ""} ·{" "}
                        {CATEGORY_LABEL[incident.category as IncidentCategory]}
                      </p>
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      {employee ? `${employee.first_name} ${employee.last_name}` : "–"}
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      <span>{CATEGORY_LABEL[incident.category as IncidentCategory]}</span>
                      {evidence > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 text-muted">
                          <Paperclip aria-hidden className="size-3.5" />
                          <span className="sr-only">Evidence files:</span>
                          {evidence}
                        </span>
                      )}
                    </td>
                    <td className="hidden px-6 py-4 md:table-cell">
                      {kase ? (
                        <Badge tone="primary">{kase.reference}</Badge>
                      ) : (
                        <span className="text-muted">No case</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right md:px-6">
                      <ChevronRight aria-hidden className="ml-auto size-5 text-muted" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
