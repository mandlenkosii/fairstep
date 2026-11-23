"use server";

import { redirect } from "next/navigation";
import { requireOwnerBusiness } from "@/lib/auth/session";
import { fieldErrors, readForm, SAVE_FAILED, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { EMPLOYEE_FIELDS, employeeSchema, toEmployeeRow } from "@/lib/validation/employee";

const DUPLICATE_NUMBER = "Another employee already has this number.";

/** Postgres unique-violation code. */
const UNIQUE_VIOLATION = "23505";

export async function createEmployee(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business } = await requireOwnerBusiness();
  const values = readForm(formData, EMPLOYEE_FIELDS);
  const parsed = employeeSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .insert({ ...toEmployeeRow(parsed.data), business_id: business.id })
    .select("id")
    .single();

  if (error?.code === UNIQUE_VIOLATION) {
    return { fieldErrors: { employeeNumber: DUPLICATE_NUMBER }, values };
  }
  if (error || !data) return { formError: SAVE_FAILED, values };

  redirect(`/app/employees/${data.id}?saved=added`);
}

export async function updateEmployee(
  employeeId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { business } = await requireOwnerBusiness();
  const values = readForm(formData, EMPLOYEE_FIELDS);
  const parsed = employeeSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .update(toEmployeeRow(parsed.data))
    .eq("id", employeeId)
    .eq("business_id", business.id)
    .select("id");

  if (error?.code === UNIQUE_VIOLATION) {
    return { fieldErrors: { employeeNumber: DUPLICATE_NUMBER }, values };
  }
  if (error || !data?.length) return { formError: SAVE_FAILED, values };

  redirect(`/app/employees/${employeeId}?saved=updated`);
}

/** Archive or restore. Employees are never deleted, so their case history stays intact. */
export async function setEmployeeStatus(employeeId: string, status: "active" | "archived") {
  const { business } = await requireOwnerBusiness();
  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ status })
    .eq("id", employeeId)
    .eq("business_id", business.id);
  if (error) throw new Error(SAVE_FAILED);

  redirect(`/app/employees/${employeeId}?saved=${status}`);
}
