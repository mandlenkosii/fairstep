"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const uuid = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const back = (path: string, query: string) => redirect(`${path}?${query}`);

/**
 * Assigns a consultant to a business. Runs as the admin (not the service role):
 * RLS allows it only for admins, with assigned_by = themselves and a user
 * whose role really is consultant.
 */
export async function assignConsultant(returnTo: string, formData: FormData) {
  const user = await requireRole("admin");
  const parsed = z.object({ businessId: uuid, consultantId: uuid }).safeParse({
    businessId: formData.get("businessId"),
    consultantId: formData.get("consultantId"),
  });
  if (!parsed.success) back(returnTo, "error=choose-consultant");

  const supabase = await createClient();
  const { error } = await supabase.from("consultant_assignments").insert({
    business_id: parsed.data!.businessId,
    consultant_id: parsed.data!.consultantId,
    assigned_by: user.id,
  });
  if (error?.code === "23505") back(returnTo, "error=already-assigned");
  if (error) back(returnTo, "error=save-failed");
  back(returnTo, "done=assigned");
}

export async function unassignConsultant(
  returnTo: string,
  businessId: string,
  consultantId: string,
) {
  await requireRole("admin");
  if (!uuid.safeParse(businessId).success || !uuid.safeParse(consultantId).success) {
    back(returnTo, "error=save-failed");
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("consultant_assignments")
    .delete()
    .eq("business_id", businessId)
    .eq("consultant_id", consultantId);
  back(returnTo, error ? "error=save-failed" : "done=unassigned");
}

/**
 * Changes a user's platform role. Users can never change roles themselves
 * (column grants), so this uses the secret-key client, only after the
 * server has checked that the caller is an admin.
 */
export async function setUserRole(userId: string, formData: FormData) {
  const admin = await requireRole("admin");
  const role = z.enum(["business_owner", "consultant", "admin"]).safeParse(formData.get("role"));
  if (!uuid.safeParse(userId).success || !role.success) back("/admin/users", "error=save-failed");
  if (userId === admin.id) back("/admin/users", "error=own-role");

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ role: role.data! })
    .eq("id", userId);
  back("/admin/users", error ? "error=save-failed" : "done=role");
}
