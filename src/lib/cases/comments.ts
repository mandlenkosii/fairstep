import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Adds a comment and a timeline event. RLS only allows this for the
 * business's owners and its assigned consultant, as themselves.
 */
export async function addCaseComment(
  supabase: Supabase,
  input: { caseId: string; businessId: string; authorId: string; body: string },
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("comments")
    .insert({
      case_id: input.caseId,
      business_id: input.businessId,
      author_id: input.authorId,
      body: input.body,
    })
    .select("id")
    .single();
  if (error || !data) return null;

  await supabase.from("case_events").insert({
    case_id: input.caseId,
    business_id: input.businessId,
    actor_id: input.authorId,
    event_type: "comment.added",
    payload: { comment_id: data.id },
  });
  return data;
}
