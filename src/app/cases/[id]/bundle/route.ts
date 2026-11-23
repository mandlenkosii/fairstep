import { getSessionUser } from "@/lib/auth/session";
import { loadCaseView } from "@/lib/cases/load-case";
import { buildBundle } from "@/lib/documents/bundle";
import { renderBundle } from "@/lib/documents/bundle-pdf";
import { ROLE_SHORT } from "@/lib/cases/labels";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABEL, type IncidentCategory } from "@/lib/validation/incident";

/**
 * GET /cases/<id>/bundle → the CCMA-ready case bundle as a PDF download.
 * For the business's owners and its assigned consultant. The case is loaded
 * with the user's own client, so RLS decides: anyone else gets a 404.
 */
export async function GET(_request: Request, ctx: RouteContext<"/cases/[id]/bundle">) {
  const user = await getSessionUser();
  if (!user) return new Response("Please log in.", { status: 401 });
  if (user.role === "admin") return new Response("Not found.", { status: 404 });

  const { id } = await ctx.params;
  const supabase = await createClient();
  const view = await loadCaseView(supabase, id);
  if (!view) return new Response("Not found.", { status: 404 });

  const { row, employee, incident } = view;
  const now = new Date();
  const bundle = buildBundle({
    reference: row.reference,
    businessName: view.business?.name ?? "",
    employee: {
      name: employee ? `${employee.first_name} ${employee.last_name}` : "Employee",
      jobTitle: employee?.job_title ?? "",
      number: employee?.employee_number,
    },
    category: incident ? CATEGORY_LABEL[incident.category as IncidentCategory] : "",
    reviewStatus: row.review_status,
    incident: incident
      ? {
          occurredAt: incident.occurred_at,
          location: incident.location,
          description: incident.description,
          witnesses: incident.witnesses,
        }
      : null,
    workflow: view.workflow,
    events: view.events.map((e) => ({
      type: e.event_type,
      payload: e.payload,
      createdAt: e.created_at,
      actorName: e.actor?.full_name ?? "Someone",
      actorRole: e.actor?.role ?? "",
    })),
    comments: view.comments.map((c) => ({
      authorName: c.author?.full_name ?? "Someone",
      authorRole: c.author?.role ?? "",
      body: c.body,
      createdAt: c.created_at,
    })),
    documents: view.documents.map((d) => ({
      kind: d.kind,
      fileName: d.file_name,
      createdAt: d.created_at,
    })),
    evidence: view.evidence.map((d) => ({ fileName: d.file_name, createdAt: d.created_at })),
    generatedAt: now,
    generatedBy: `${user.fullName} (${ROLE_SHORT[user.role]})`,
  });
  const pdf = await renderBundle(bundle);

  // Exporting is part of the record too.
  await supabase.from("case_events").insert({
    case_id: row.id,
    business_id: row.business_id,
    actor_id: user.id,
    event_type: "bundle.exported",
    payload: {},
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${row.reference}-case-bundle.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
