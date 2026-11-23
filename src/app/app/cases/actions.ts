"use server";

import { redirect } from "next/navigation";
import { requireOwnerBusiness } from "@/lib/auth/session";
import { openCase } from "@/lib/cases/open-case";
import { one } from "@/lib/supabase/one";
import { createClient } from "@/lib/supabase/server";
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
