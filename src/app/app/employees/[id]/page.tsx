import { Archive, ArrowLeft, CheckCircle2, Pencil, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { requireOwnerBusiness } from "@/lib/auth/session";
import { formatDate, initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { setEmployeeStatus, updateEmployee } from "../actions";

export const metadata: Metadata = { title: "Employee" };

const SAVED_MESSAGES: Record<string, string> = {
  added: "Employee added.",
  updated: "Changes saved.",
  archived: "Employee archived. Their incidents and cases stay on record.",
  active: "Employee restored to the active register.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EmployeePage({
  params,
  searchParams,
}: PageProps<"/app/employees/[id]">) {
  const { business } = await requireOwnerBusiness();
  const { id } = await params;
  const { saved, edit } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [{ data: employee }, { data: incidents }, { data: cases }] = await Promise.all([
    supabase
      .from("employees")
      .select("*")
      .eq("id", id)
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase
      .from("incidents")
      .select("id, occurred_at, category")
      .eq("employee_id", id)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("cases")
      .select("id, reference, current_step")
      .eq("employee_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!employee) notFound();

  const name = `${employee.first_name} ${employee.last_name}`;
  const isArchived = employee.status === "archived";
  const editing = edit === "1" && !isArchived;
  const savedMessage = typeof saved === "string" ? SAVED_MESSAGES[saved] : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <Link
        href="/app/employees"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Employees
      </Link>

      {savedMessage && (
        <p
          role="status"
          className="mt-4 flex items-center gap-2 rounded-lg bg-success-tint px-3 py-2 text-sm text-success-strong"
        >
          <CheckCircle2 aria-hidden className="size-4" />
          {savedMessage}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <span
          aria-hidden
          className="flex size-14 items-center justify-center rounded-full bg-primary-tint text-lg font-semibold text-primary"
        >
          {initials(name)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-headline-lg">{name}</h1>
          <p className="text-muted">{employee.job_title}</p>
        </div>
        <Badge tone={isArchived ? "neutral" : "success"}>
          {isArchived ? "Archived" : "Active"}
        </Badge>
      </div>

      {editing ? (
        <Card className="mt-6">
          <CardTitle className="mb-5">Edit details</CardTitle>
          <EmployeeForm
            action={updateEmployee.bind(null, employee.id)}
            submitLabel="Save changes"
            cancelHref={`/app/employees/${employee.id}`}
            defaults={{
              firstName: employee.first_name,
              lastName: employee.last_name,
              employeeNumber: employee.employee_number ?? "",
              jobTitle: employee.job_title,
              startDate: employee.start_date ?? "",
              workPhone: employee.work_phone ?? "",
              workEmail: employee.work_email ?? "",
            }}
          />
        </Card>
      ) : (
        <Card className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Details</CardTitle>
            <div className="flex flex-wrap gap-2">
              {!isArchived && (
                <ButtonLink href={`/app/employees/${employee.id}?edit=1`} variant="secondary">
                  <Pencil aria-hidden className="size-4" />
                  Edit
                </ButtonLink>
              )}
              <form
                action={setEmployeeStatus.bind(
                  null,
                  employee.id,
                  isArchived ? "active" : "archived",
                )}
              >
                <Button type="submit" variant="ghost">
                  {isArchived ? (
                    <RotateCcw aria-hidden className="size-4" />
                  ) : (
                    <Archive aria-hidden className="size-4" />
                  )}
                  {isArchived ? "Restore" : "Archive"}
                </Button>
              </form>
            </div>
          </div>
          <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Detail label="Employee number" value={employee.employee_number} />
            <Detail label="Start date" value={formatDate(employee.start_date)} />
            <Detail label="Work phone" value={employee.work_phone} />
            <Detail label="Work email" value={employee.work_email} />
          </dl>
          {isArchived && (
            <p className="mt-5 text-sm text-muted">
              Archived employees stay on record with their incidents and cases. Restore them to edit
              their details or log new incidents.
            </p>
          )}
        </Card>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Incidents</CardTitle>
          {incidents?.length ? (
            <ul className="mt-3 divide-y divide-line">
              {incidents.map((incident) => (
                <li key={incident.id}>
                  <Link
                    href={`/app/incidents/${incident.id}`}
                    className="flex justify-between gap-3 py-3 hover:text-primary"
                  >
                    <span className="capitalize">{incident.category.replaceAll("_", " ")}</span>
                    <span className="text-muted">{formatDate(incident.occurred_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">No incidents logged.</p>
          )}
        </Card>
        <Card>
          <CardTitle>Cases</CardTitle>
          {cases?.length ? (
            <ul className="mt-3 divide-y divide-line">
              {cases.map((kase) => (
                <li key={kase.id}>
                  <Link
                    href={`/app/cases/${kase.id}`}
                    className="flex justify-between gap-3 py-3 hover:text-primary"
                  >
                    <span className="font-semibold">{kase.reference}</span>
                    <span className="text-muted capitalize">{kase.current_step}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">No disciplinary cases.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="label-caps text-muted">{label}</dt>
      <dd className="mt-1 text-ink">{value || "–"}</dd>
    </div>
  );
}
