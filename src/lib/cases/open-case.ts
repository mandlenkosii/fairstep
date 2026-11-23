import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import type { createClient } from "@/lib/supabase/server";
import { canTransition } from "@/lib/workflow/rules";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Opens a disciplinary case from an incident and moves it to the
 * investigation step, writing both events to the timeline. If the incident
 * already has a case, returns that one (one case per incident).
 * Called only from owner server actions, after requireOwnerBusiness().
 */
export async function openCase(
  supabase: Supabase,
  { businessId, userId, incidentId }: { businessId: string; userId: string; incidentId: string },
): Promise<{ caseId: string } | { error: string }> {
  const { data: incident } = await supabase
    .from("incidents")
    .select("id, employee_id, cases (id)")
    .eq("id", incidentId)
    .eq("business_id", businessId)
    .maybeSingle();
  if (!incident) return { error: "We couldn't find that incident." };

  const existing = Array.isArray(incident.cases) ? incident.cases[0] : incident.cases;
  if (existing) return { caseId: existing.id };

  // A new case starts at the incident step; moving on to investigation is always allowed.
  const check = canTransition({ currentStep: "incident", people: {} }, "investigation", new Date());
  const { data: kase, error } = await supabase
    .from("cases")
    .insert({
      business_id: businessId,
      employee_id: incident.employee_id,
      incident_id: incident.id,
      current_step: check.ok ? "investigation" : "incident",
      created_by: userId,
    })
    .select("id")
    .single();
  if (error || !kase) return { error: "We couldn't open the case. Please try again." };

  const events: Database["public"]["Tables"]["case_events"]["Insert"][] = [
    {
      case_id: kase.id,
      business_id: businessId,
      actor_id: userId,
      event_type: "case.opened",
      payload: { incident_id: incident.id },
    },
  ];
  if (check.ok) {
    events.push({
      case_id: kase.id,
      business_id: businessId,
      actor_id: userId,
      event_type: "step.advanced",
      payload: { from: "incident", to: "investigation" },
    });
  }
  await supabase.from("case_events").insert(events);
  return { caseId: kase.id };
}
