"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { addCaseComment } from "@/lib/cases/comments";
import { fieldErrors, readForm, SAVE_FAILED, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { commentSchema, reviewSchema } from "@/lib/validation/review";

/**
 * Loads a case the consultant may review. RLS only returns cases from
 * businesses assigned to them, so another business's case is simply not found.
 */
async function assignedCase(caseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cases")
    .select("id, business_id, review_status, closed_at")
    .eq("id", caseId)
    .maybeSingle();
  return { supabase, kase: data };
}

export async function addConsultantComment(
  caseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("consultant");
  const values = readForm(formData, ["body"]);
  const parsed = commentSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const { supabase, kase } = await assignedCase(caseId);
  if (!kase) return { formError: "We couldn't find that case.", values };
  const added = await addCaseComment(supabase, {
    caseId,
    businessId: kase.business_id,
    authorId: user.id,
    body: parsed.data.body,
  });
  if (!added) return { formError: SAVE_FAILED, values };
  redirect(`/consultant/cases/${caseId}?commented=1`);
}

/** Approve, or request changes (comment required). Only on a case waiting for review. */
export async function reviewCase(
  caseId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("consultant");
  const values = readForm(formData, ["decision", "body"]);
  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const { supabase, kase } = await assignedCase(caseId);
  if (!kase) return { formError: "We couldn't find that case.", values };
  if (kase.review_status !== "pending_review") {
    return { formError: "This case isn't waiting for your review.", values };
  }

  const approve = parsed.data.decision === "approve";
  let commentId: string | undefined;
  if (parsed.data.body) {
    const added = await addCaseComment(supabase, {
      caseId,
      businessId: kase.business_id,
      authorId: user.id,
      body: parsed.data.body,
    });
    if (!added) return { formError: SAVE_FAILED, values };
    commentId = added.id;
  }

  // RLS (assigned consultant) and the guard trigger (pending → approved/changes) check this again.
  const { error } = await supabase
    .from("cases")
    .update({ review_status: approve ? "approved" : "changes_requested" })
    .eq("id", caseId);
  if (error) return { formError: SAVE_FAILED, values };

  await supabase.from("case_events").insert({
    case_id: caseId,
    business_id: kase.business_id,
    actor_id: user.id,
    event_type: approve ? "review.approved" : "review.changes_requested",
    payload: commentId ? { comment_id: commentId } : {},
  });
  redirect(`/consultant/cases/${caseId}?reviewed=${approve ? "approved" : "changes"}`);
}
