import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { IncidentForm } from "@/components/incidents/incident-form";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireOwnerBusiness } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createIncident } from "../actions";

export const metadata: Metadata = { title: "Log an incident" };

/** Today's date and the current time in SAST, as form defaults. */
function sastNow() {
  const iso = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

export default async function NewIncidentPage({ searchParams }: PageProps<"/app/incidents/new">) {
  const { business } = await requireOwnerBusiness();
  const { employee } = await searchParams;

  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, first_name, last_name, job_title")
    .eq("business_id", business.id)
    .eq("status", "active")
    .order("first_name");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
      <Link
        href="/app/incidents"
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Incidents
      </Link>
      <h1 className="mt-3 text-headline-lg">Log an incident</h1>
      <p className="mt-1 mb-6 text-muted">
        Write it down today, while it’s fresh. Stick to facts: what happened, when, and who saw it.
      </p>
      <Card>
        {employees?.length ? (
          <IncidentForm
            action={createIncident}
            employees={employees.map((e) => ({
              id: e.id,
              name: `${e.first_name} ${e.last_name}`,
              jobTitle: e.job_title,
            }))}
            defaults={{
              ...sastNow(),
              employeeId: typeof employee === "string" ? employee : undefined,
            }}
          />
        ) : (
          <div className="py-6 text-center">
            <p className="font-semibold">Add an employee first</p>
            <p className="mt-1 text-muted">Every incident is linked to someone on your register.</p>
            <ButtonLink href="/app/employees/new" className="mt-4">
              Add employee
            </ButtonLink>
          </div>
        )}
      </Card>
    </div>
  );
}
