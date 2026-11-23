import "server-only";
import type { createClient } from "@/lib/supabase/server";
import { one } from "@/lib/supabase/one";
import { caseToWorkflow } from "@/lib/workflow/view";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Private files open through links that expire after 10 minutes. */
const SIGNED_URL_SECONDS = 600;

async function signedUrls(supabase: Supabase, bucket: string, paths: string[]) {
  if (!paths.length) return new Map<string, string>();
  const { data } = await supabase.storage.from(bucket).createSignedUrls(paths, SIGNED_URL_SECONDS);
  return new Map(
    (data ?? []).flatMap((s) => (s.path && s.signedUrl ? [[s.path, s.signedUrl]] : [])),
  );
}

/**
 * Everything a case page shows, for the owner or the assigned consultant.
 * Uses the signed-in user's client, so RLS decides what comes back: a case
 * from a business the user can't see simply returns null.
 */
export async function loadCaseView(supabase: Supabase, caseId: string) {
  if (!UUID.test(caseId)) return null;

  const { data: row } = await supabase
    .from("cases")
    .select(
      "*, business:businesses (id, name), employee:employees (id, first_name, last_name, job_title, employee_number), incident:incidents (id, occurred_at, witnesses, category, location, description)",
    )
    .eq("id", caseId)
    .maybeSingle();
  if (!row) return null;

  const incident = one(row.incident);
  const [{ data: events }, { data: comments }, { data: docs }] = await Promise.all([
    supabase
      .from("case_events")
      .select("id, event_type, payload, created_at, actor:profiles (full_name, role)")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select("id, body, created_at, author:profiles (full_name, role)")
      .eq("case_id", caseId)
      .order("created_at"),
    supabase
      .from("documents")
      .select("id, kind, file_name, created_at, storage_path, mime_type")
      .or(`case_id.eq.${caseId}${incident ? `,incident_id.eq.${incident.id}` : ""}`)
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const letters = (docs ?? []).filter((d) => d.kind !== "evidence");
  const evidence = (docs ?? []).filter((d) => d.kind === "evidence");
  const [letterUrls, evidenceUrls] = await Promise.all([
    signedUrls(
      supabase,
      "documents",
      letters.map((d) => d.storage_path),
    ),
    signedUrls(
      supabase,
      "evidence",
      evidence.map((d) => d.storage_path),
    ),
  ]);

  return {
    row,
    business: one(row.business),
    employee: one(row.employee),
    incident,
    workflow: caseToWorkflow({ ...row, incident }),
    events: (events ?? []).map((e) => ({ ...e, actor: one(e.actor) })),
    comments: (comments ?? []).map((c) => ({ ...c, author: one(c.author) })),
    documents: letters.map((d) => ({ ...d, url: letterUrls.get(d.storage_path) })),
    evidence: evidence.map((d) => ({ ...d, url: evidenceUrls.get(d.storage_path) })),
  };
}

export type CaseView = NonNullable<Awaited<ReturnType<typeof loadCaseView>>>;
