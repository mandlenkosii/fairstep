import { ChevronRight, Search, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { requireOwnerBusiness } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { formatDate, initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Employees" };

export default async function EmployeesPage({ searchParams }: PageProps<"/app/employees">) {
  const { business } = await requireOwnerBusiness();
  const params = await searchParams;
  const status = params.status === "archived" ? "archived" : "active";
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";

  const supabase = await createClient();
  let request = supabase
    .from("employees")
    .select("id, first_name, last_name, employee_number, job_title, start_date, status")
    .eq("business_id", business.id)
    .eq("status", status)
    .order("first_name")
    .order("last_name");
  if (query) {
    // Strip characters that have a meaning in PostgREST filters.
    const safe = query.replace(/[%,().*]/g, " ");
    request = request.or(
      `first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,job_title.ilike.%${safe}%,employee_number.ilike.%${safe}%`,
    );
  }
  const [{ data: employees, error }, { count: activeCount }] = await Promise.all([
    request,
    supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("status", "active"),
  ]);
  if (error) throw new Error("We couldn't load your employees. Please refresh the page.");

  const tabHref = (s: string) => `/app/employees${s === "archived" ? "?status=archived" : ""}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-headline-lg">Employees</h1>
          <p className="mt-1 text-muted">
            {activeCount ?? 0} active at {business.name}
          </p>
        </div>
        <ButtonLink href="/app/employees/new">
          <UserPlus aria-hidden className="size-4" />
          Add employee
        </ButtonLink>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Employee status"
          className="flex gap-1 rounded-lg bg-surface p-1 ring-1 ring-line"
        >
          {(["active", "archived"] as const).map((s) => (
            <Link
              key={s}
              href={tabHref(s)}
              aria-current={status === s ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-semibold capitalize",
                status === s ? "bg-primary-tint text-primary" : "text-muted hover:text-ink",
              )}
            >
              {s}
            </Link>
          ))}
        </nav>
        <form role="search" className="relative w-full sm:w-80">
          {status === "archived" && <input type="hidden" name="status" value="archived" />}
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
          />
          <Input
            name="q"
            type="search"
            defaultValue={query}
            aria-label="Search employees"
            placeholder="Search name, job or number"
            className="pl-9"
          />
        </form>
      </div>

      {employees.length === 0 ? (
        <Card className="mt-6 flex flex-col items-center py-12 text-center">
          <Users aria-hidden className="size-10 text-muted" />
          {query ? (
            <>
              <p className="mt-3 font-semibold">No employees match “{query}”</p>
              <Link
                href={tabHref(status)}
                className="mt-2 text-sm font-semibold text-primary underline"
              >
                Clear the search
              </Link>
            </>
          ) : status === "archived" ? (
            <p className="mt-3 font-semibold">No archived employees</p>
          ) : (
            <>
              <p className="mt-3 font-semibold">No employees yet</p>
              <p className="mt-1 max-w-sm text-muted">
                Add your team first, so incidents and cases are linked to the right person.
              </p>
              <ButtonLink href="/app/employees/new" className="mt-5">
                <UserPlus aria-hidden className="size-4" />
                Add your first employee
              </ButtonLink>
            </>
          )}
        </Card>
      ) : (
        <Card className="mt-6 overflow-hidden p-0 sm:p-0">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              {status === "archived" ? "Archived" : "Active"} employees
            </caption>
            <thead className="hidden border-b border-line bg-paper lg:table-header-group">
              <tr className="label-caps text-muted">
                <th scope="col" className="px-6 py-3 font-semibold">
                  Employee
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  Number
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  Start date
                </th>
                <th scope="col" className="px-6 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {employees.map((e) => {
                const name = `${e.first_name} ${e.last_name}`;
                return (
                  <tr key={e.id} className="relative hover:bg-paper">
                    <td className="px-4 py-4 lg:px-6">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-sm font-semibold text-primary"
                        >
                          {initials(name)}
                        </span>
                        <div className="min-w-0">
                          <Link
                            href={`/app/employees/${e.id}`}
                            className="font-semibold text-ink after:absolute after:inset-0 focus-visible:outline-none"
                          >
                            {name}
                          </Link>
                          <p className="text-muted">{e.job_title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 text-muted lg:table-cell">
                      {e.employee_number ?? "–"}
                    </td>
                    <td className="hidden px-6 py-4 text-muted lg:table-cell">
                      {formatDate(e.start_date)}
                    </td>
                    <td className="hidden px-6 py-4 lg:table-cell">
                      <Badge tone={e.status === "active" ? "success" : "neutral"}>
                        {e.status === "active" ? "Active" : "Archived"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right lg:px-6">
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
