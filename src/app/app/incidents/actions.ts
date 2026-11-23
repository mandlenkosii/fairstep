"use server";

import { requireOwnerBusiness } from "@/lib/auth/session";
import { openCase } from "@/lib/cases/open-case";
import { fieldErrors, readForm, SAVE_FAILED, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import {
  evidenceRecordSchema,
  INCIDENT_FIELDS,
  incidentSchema,
  MAX_EVIDENCE_FILES,
  type EvidenceRecord,
} from "@/lib/validation/incident";

export type IncidentFormState = FormState & {
  /** Set once the incident is saved, so the browser can upload the evidence. */
  saved?: { incidentId: string; businessId: string; caseId?: string };
};

export async function createIncident(
  _prev: IncidentFormState,
  formData: FormData,
): Promise<IncidentFormState> {
  const { user, business } = await requireOwnerBusiness();
  const values = readForm(formData, INCIDENT_FIELDS);
  const parsed = incidentSchema(new Date()).safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("id", parsed.data.employeeId)
    .eq("business_id", business.id)
    .eq("status", "active")
    .maybeSingle();
  if (!employee) {
    return { fieldErrors: { employeeId: "Choose an active employee from your register." }, values };
  }

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      business_id: business.id,
      employee_id: employee.id,
      occurred_at: parsed.data.occurredAt,
      location: parsed.data.location,
      category: parsed.data.category,
      description: parsed.data.description,
      witnesses: parsed.data.witnesses,
      reported_by: user.id,
    })
    .select("id")
    .single();
  if (error || !data) return { formError: SAVE_FAILED, values };

  // "Start a disciplinary case from this incident" was ticked.
  let caseId: string | undefined;
  if (formData.get("startCase") === "on") {
    const opened = await openCase(supabase, {
      businessId: business.id,
      userId: user.id,
      incidentId: data.id,
    });
    if ("caseId" in opened) caseId = opened.caseId;
  }

  return { saved: { incidentId: data.id, businessId: business.id, caseId } };
}

/**
 * Records evidence files the browser has uploaded to the private bucket.
 * Checks each file is in this incident's folder and really exists in storage.
 */
export async function recordEvidence(
  incidentId: string,
  files: EvidenceRecord[],
): Promise<{ error?: string }> {
  const { user, business } = await requireOwnerBusiness();
  const parsed = evidenceRecordSchema.array().max(MAX_EVIDENCE_FILES).safeParse(files);
  if (!parsed.success) return { error: "Some files couldn't be checked. Please try again." };

  const folder = `${business.id}/incidents/${incidentId}`;
  if (parsed.data.some((file) => !file.path.startsWith(`${folder}/`) || file.path.includes(".."))) {
    return { error: "Some files were saved in the wrong place. Please try again." };
  }

  const supabase = await createClient();
  const { data: incident } = await supabase
    .from("incidents")
    .select("id")
    .eq("id", incidentId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!incident) return { error: SAVE_FAILED };

  const { data: stored } = await supabase.storage.from("evidence").list(folder, { limit: 1000 });
  const storedNames = new Set((stored ?? []).map((object) => `${folder}/${object.name}`));
  if (parsed.data.some((file) => !storedNames.has(file.path))) {
    return { error: "Some files didn't finish uploading. Please add them again." };
  }

  const { error } = await supabase.from("documents").insert(
    parsed.data.map((file) => ({
      business_id: business.id,
      incident_id: incidentId,
      kind: "evidence",
      storage_path: file.path,
      file_name: file.fileName,
      mime_type: file.mimeType,
      size_bytes: file.size,
      created_by: user.id,
    })),
  );
  return error ? { error: SAVE_FAILED } : {};
}
