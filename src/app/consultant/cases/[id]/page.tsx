import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseDocuments } from "@/components/cases/case-documents";
import {
  CaseComments,
  CaseHeader,
  CaseIncident,
  CaseStepper,
  CaseTimeline,
  Notice,
} from "@/components/cases/case-parts";
import { CaseRecord } from "@/components/cases/case-record";
import { CommentForm, ReviewDecisionForm } from "@/components/cases/review-forms";
import { Card, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { loadCaseView } from "@/lib/cases/load-case";
import { createClient } from "@/lib/supabase/server";
import { canTransition, nextSteps } from "@/lib/workflow/rules";
import { addConsultantComment, reviewCase } from "../../actions";

export const metadata: Metadata = { title: "Review case" };

/** The consultant's view: everything readable, nothing editable except review and comments. */
export default async function ConsultantCasePage({
  params,
  searchParams,
}: PageProps<"/consultant/cases/[id]">) {
  await requireRole("consultant");
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createClient();
  const view = await loadCaseView(supabase, id);
  if (!view) notFound();

  const { row, workflow } = view;
  const now = new Date();
  // What would block the owner's next step, so the consultant sees the same checks.
  const blockers =
    workflow.currentStep === "closed"
      ? []
      : nextSteps(workflow.currentStep).flatMap((to) => {
          const result = canTransition(workflow, to, now);
          return result.ok ? [] : result.reasons.map((r) => r.message);
        });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <Link
        href="/consultant"
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Review queue
      </Link>

      {query.reviewed === "approved" && (
        <Notice>Case approved. The owner can see your sign-off.</Notice>
      )}
      {query.reviewed === "changes" && (
        <Notice>Changes requested. The case is back with the owner.</Notice>
      )}
      {query.commented === "1" && <Notice>Comment added.</Notice>}

      <CaseHeader view={view} subtitle={view.business?.name} />
      <CaseStepper view={view} />

      <section aria-labelledby="review-heading" className="mt-6">
        <Card>
          <CardTitle id="review-heading">Your review</CardTitle>
          {row.review_status === "pending_review" ? (
            <>
              <p className="mt-2 mb-4 text-sm text-muted">
                Check the process: allegations, notice, a fair chance to respond, an impartial
                chair, and reasons for the outcome.
              </p>
              {blockers.length > 0 && (
                <div className="mb-4 rounded-lg bg-warning-tint p-3 text-sm text-warning-strong">
                  <p className="font-semibold">FairStep’s checks still flag:</p>
                  <ul className="mt-1 list-disc pl-5">
                    {blockers.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              <ReviewDecisionForm action={reviewCase.bind(null, row.id)} />
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">
              {row.review_status === "approved"
                ? "You approved this case."
                : row.review_status === "changes_requested"
                  ? "You requested changes. The owner will send it back when it’s fixed."
                  : "The owner hasn’t sent this case for review yet. You can still read it and comment."}
            </p>
          )}
        </Card>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <CaseRecord workflow={workflow} />
          <CaseIncident view={view} />
          <CaseDocuments
            caseId={row.id}
            workflow={workflow}
            documents={view.documents}
            canGenerate={false}
          />
          <CaseComments view={view}>
            <CommentForm action={addConsultantComment.bind(null, row.id)} />
          </CaseComments>
        </div>
        <CaseTimeline view={view} className="lg:col-span-2" />
      </div>
    </div>
  );
}
