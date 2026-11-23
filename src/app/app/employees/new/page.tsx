import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmployeeForm } from "@/components/employees/employee-form";
import { Card } from "@/components/ui/card";
import { requireOwnerBusiness } from "@/lib/auth/session";
import { createEmployee } from "../actions";

export const metadata: Metadata = { title: "Add employee" };

export default async function NewEmployeePage() {
  const { business } = await requireOwnerBusiness();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
      <Link
        href="/app/employees"
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Employees
      </Link>
      <h1 className="mt-3 text-headline-lg">Add employee</h1>
      <p className="mt-1 mb-6 text-muted">They’ll be added to the register for {business.name}.</p>
      <Card>
        <EmployeeForm
          action={createEmployee}
          submitLabel="Add employee"
          cancelHref="/app/employees"
        />
      </Card>
    </div>
  );
}
