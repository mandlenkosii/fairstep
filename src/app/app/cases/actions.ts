"use server";

import { redirect } from "next/navigation";
import { requireOwnerBusiness } from "@/lib/auth/session";
import { openCase } from "@/lib/cases/open-case";
import { renderLetter } from "@/lib/documents/letter-pdf";
import {
  buildLetter,
  documentReadiness,
  LETTER_LABEL,
  type LetterKind,
} from "@/lib/documents/letters";
import { readForm, SAVE_FAILED, type FormState } from "@/lib/forms";
import type { Json } from "@/lib/supabase/database.types";
import { one } from "@/lib/supabase/one";
import { createClient } from "@/lib/supabase/server";
import {
  parseStep,
  RECORDABLE_STEPS,
  STEP_FIELDS,
  type RecordableStep,
} from "@/lib/validation/steps";
import { canTransition } from "@/lib/workflow/rules";
import { STEP_ORDER } from "@/lib/workflow/rules.config";
import type { Step } from "@/lib/workflow/types";
import { caseToWorkflow } from "@/lib/workflow/view";

export async function startCaseFromIncident(incidentId: string) {
  const { user, business } = await requireOwnerBusiness();
  const supabase = await createClient();
  const result = await openCase(supabase, {
    businessId: business.id,
    userId: user.id,
    incidentId,
  });
  if ("error" in result) throw new Error(result.error);
  redirect(`/app/cases/${result.caseId}?opened=1`);
}

/**
 * Moves a case to the next step. The rules run here on the server, on fresh
 * data, so the button in the browser can never skip them.
 */
export async function advanceCase(caseId: string, to: Step) {
  const { user, business } = await requireOwnerBusiness();
  if (!(STEP_ORDER as readonly string[]).includes(to)) throw new Error("Unknown step.");

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("cases")
    .select(
      "id, current_step, closed_at, complainant_name, chairperson_name, step_data, incident:incidents (occurred_at, witnesses)",
    )
    .eq("id", caseId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!row) throw new Error("We couldn't find that case.");

  const result = canTransition(
    caseToWorkflow({ ...row, incident: one(row.incident) }),
    to,
    new Date(),
  );
  if (!result.ok) redirect(`/app/cases/${caseId}?blocked=${to}`);

  const closing = to === "closed";
  const { error } = await supabase
    .from("cases")
    .update({ current_step: to, closed_at: closing ? new Date().toISOString() : null })
    .eq("id", caseId)
    .eq("business_id", business.id);
  if (error) throw new Error("We couldn't move the case. Please try again.");

  await supabase.from("case_events").insert({
    case_id: caseId,
    business_id: business.id,
    actor_id: user.id,
    event_type: "step.advanced",
    payload: { from: row.current_step, to },
  });
  redirect(`/app/cases/${caseId}?moved=${to}`);
}

export type StepFormState = FormState;

/**
 * Saves the details of the step the case is on (investigation, notice, …).
 * Moving on is separate (advanceCase), so the rules can say what's still missing.
 */
export async function saveStep(
  caseId: string,
  step: RecordableStep,
  _prev: StepFormState,
  formData: FormData,
): Promise<StepFormState> {
  const { user, business } = await requireOwnerBusiness();
  if (!RECORDABLE_STEPS.includes(step)) return { formError: "Unknown step." };
  const values = readForm(formData, STEP_FIELDS[step]);

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("cases")
    .select("id, current_step, closed_at, step_data")
    .eq("id", caseId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!row) return { formError: "We couldn't find that case.", values };
  if (row.closed_at) {
    return { formError: "This case is closed. Add a note instead of changing the record.", values };
  }
  if (row.current_step !== step) {
    return { formError: "You can only record details for the step the case is on.", values };
  }

  const parsed = parseStep(step, values);
  if (!parsed.ok) return { fieldErrors: parsed.fieldErrors, values };

  const stepData =
    row.step_data && typeof row.step_data === "object" && !Array.isArray(row.step_data)
      ? row.step_data
      : {};
  const { error } = await supabase
    .from("cases")
    .update({
      ...parsed.data.columns,
      step_data: { ...stepData, [step]: parsed.data.section } as { [key: string]: Json },
    })
    .eq("id", caseId)
    .eq("business_id", business.id);
  if (error) return { formError: SAVE_FAILED, values };

  await supabase.from("case_events").insert({
    case_id: caseId,
    business_id: business.id,
    actor_id: user.id,
    event_type: "step.recorded",
    payload: { step },
  });
  redirect(`/app/cases/${caseId}?recorded=${step}`);
}

/**
 * Generates a letter as a PDF on the server, saves it to the private
 * "documents" bucket and records it on the case. Refused unless the
 * workflow rules for that letter pass (e.g. R2–R5 for a notice).
 */
export async function generateLetter(caseId: string, kind: LetterKind) {
  const { user, business } = await requireOwnerBusiness();
  if (!(kind in LETTER_LABEL)) throw new Error("Unknown letter.");

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("cases")
    .select(
      "id, reference, current_step, closed_at, complainant_name, chairperson_name, step_data, employee:employees (first_name, last_name, job_title, employee_number), incident:incidents (occurred_at, witnesses)",
    )
    .eq("id", caseId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!row) throw new Error("We couldn't find that case.");

  const now = new Date();
  const workflow = caseToWorkflow({ ...row, incident: one(row.incident) });
  if (!documentReadiness(workflow, kind, now).ok)
    redirect(`/app/cases/${caseId}?docblocked=${kind}`);

  const employee = one(row.employee);
  const letter = buildLetter(kind, {
    business: { name: business.name },
    employee: {
      name: employee ? `${employee.first_name} ${employee.last_name}` : "Employee",
      jobTitle: employee?.job_title ?? "",
      number: employee?.employee_number,
    },
    reference: row.reference,
    issuedBy: user.fullName,
    workflow,
    generatedAt: now,
  });
  const pdf = await renderLetter(letter);

  const fileName = `${row.reference}-${kind.replace("_", "-")}.pdf`;
  const path = `${business.id}/cases/${caseId}/${now.getTime()}-${fileName}`;
  const upload = await supabase.storage
    .from("documents")
    .upload(path, pdf, { contentType: "application/pdf", upsert: false });
  if (upload.error) throw new Error("We couldn't save the letter. Please try again.");

  const { data: doc, error } = await supabase
    .from("documents")
    .insert({
      business_id: business.id,
      case_id: caseId,
      kind,
      storage_path: path,
      file_name: fileName,
      mime_type: "application/pdf",
      size_bytes: pdf.byteLength,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error || !doc) throw new Error("We couldn't record the letter. Please try again.");

  await supabase.from("case_events").insert({
    case_id: caseId,
    business_id: business.id,
    actor_id: user.id,
    event_type: "document.generated",
    payload: { kind, document_id: doc.id },
  });
  redirect(`/app/cases/${caseId}?generated=${kind}`);
}
