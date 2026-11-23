import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
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
import { CommentForm, SendForReviewForm } from "@/components/cases/review-forms";
import { StepForm } from "@/components/cases/step-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { requireOwnerBusiness } from "@/lib/auth/session";
import { REVIEW_STATUS } from "@/lib/cases/labels";
import { loadCaseView } from "@/lib/cases/load-case";
import { LETTER_LABEL, type LetterKind } from "@/lib/documents/letters";
import { createClient } from "@/lib/supabase/server";
import { RECORDABLE_STEPS, stepDefaults, type RecordableStep } from "@/lib/validation/steps";
import { canTransition, nextSteps } from "@/lib/workflow/rules";
import type { Step } from "@/lib/workflow/types";
import { STEP_LABEL } from "@/lib/workflow/view";
import { addOwnerComment, advanceCase, requestReview, saveStep } from "../actions";

export const metadata: Metadata = { title: "Case" };

export default async function CasePage({ params, searchParams }: PageProps<"/app/cases/[id]">) {
  const { business } = await requireOwnerBusiness();
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createClient();
  const view = await loadCaseView(supabase, id);
  if (!view || view.row.business_id !== business.id) notFound();

  const { row, workflow } = view;
  const now = new Date();
  const closed = workflow.currentStep === "closed";
  const options = closed
    ? []
    : nextSteps(workflow.currentStep).map((to) => ({
        to,
        result: canTransition(workflow, to, now),
      }));
  const recordable = (RECORDABLE_STEPS as string[]).includes(workflow.currentStep)
    ? (workflow.currentStep as RecordableStep)
    : null;
  const canSendForReview =
    !closed && ["not_requested", "changes_requested"].includes(row.review_status);
  const label = (value: unknown) =>
    typeof value === "string" ? STEP_LABEL[value as Step] : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <Link
        href="/app/cases"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Cases
      </Link>

      {query.opened === "1" && (
        <Notice>
          Case {row.reference} opened. Start with the investigation: find out what happened before
          anyone is accused.
        </Notice>
      )}
      {label(query.moved) && <Notice>Case moved to {label(query.moved)}.</Notice>}
      {label(query.recorded) && (
        <Notice>{label(query.recorded)} details saved. Check what’s next below.</Notice>
      )}
      {typeof query.generated === "string" && (
        <Notice>
          {LETTER_LABEL[query.generated as LetterKind] ?? "Document"} generated. Open it below,
          print it and give it to the employee.
        </Notice>
      )}
      {query.review === "sent" && (
        <Notice>Sent to your consultant. You’ll see their comments and decision here.</Notice>
      )}
      {query.commented === "1" && <Notice>Comment added.</Notice>}

      <CaseHeader view={view} />
      <CaseStepper view={view} />

      {recordable && (
        <section aria-labelledby="record-heading" className="mt-6">
          <Card>
            <CardTitle id="record-heading">
              Record the {STEP_LABEL[recordable].toLowerCase()}
            </CardTitle>
            <p className="mt-1 mb-5 text-sm text-muted">
              Save as you go. FairStep checks the rules when you move the case on.
            </p>
            <StepForm
              key={recordable}
              step={recordable}
              action={saveStep.bind(null, row.id, recordable)}
              defaults={stepDefaults(recordable, row)}
            />
          </Card>
        </section>
      )}

      <section aria-labelledby="next-heading" className="mt-6">
        <Card>
          <CardTitle id="next-heading">What’s next</CardTitle>
          {closed ? (
            <p className="mt-2 text-muted">
              This case is closed. The record can’t be changed, but you can still read it and add
              comments.
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {options.map(({ to, result }) => (
                <li key={to} className="rounded-xl border border-line p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold">
                      {to === "closed" ? "Close the case" : `Move to ${STEP_LABEL[to]}`}
                      {to === "appeal" && (
                        <span className="font-normal text-muted"> (optional)</span>
                      )}
                    </p>
                    {result.ok ? (
                      <form action={advanceCase.bind(null, row.id, to)}>
                        <Button type="submit">
                          {to === "closed" ? "Close case" : "Continue"}
                          <ArrowRight aria-hidden className="size-4" />
                        </Button>
                      </form>
                    ) : (
                      <Badge tone="warning">
                        <Lock aria-hidden className="mr-1 size-3.5" />
                        Not yet
                      </Badge>
                    )}
                  </div>
                  {!result.ok && (
                    <ul className="mt-3 flex flex-col gap-2">
                      {result.reasons.map((reason) => (
                        <li
                          key={reason.code}
                          className="flex gap-2 rounded-lg bg-warning-tint px-3 py-2 text-sm text-warning-strong"
                        >
                          <Lock aria-hidden className="mt-0.5 size-4 shrink-0" />
                          {reason.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
          {query.blocked && (
            <p role="alert" className="mt-4 text-sm text-danger">
              That step is still blocked. Fix the points above first.
            </p>
          )}
        </Card>
      </section>

      <section aria-labelledby="review-heading" className="mt-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle id="review-heading">Consultant review</CardTitle>
            <Badge tone={(REVIEW_STATUS[row.review_status] ?? REVIEW_STATUS.not_requested).tone}>
              {(REVIEW_STATUS[row.review_status] ?? REVIEW_STATUS.not_requested).label}
            </Badge>
          </div>
          <p className="mt-2 mb-4 text-sm text-muted">
            {row.review_status === "pending_review"
              ? "Your consultant is checking the case. Their comments and decision will appear here."
              : row.review_status === "approved"
                ? "Your consultant approved the case. You can send it again if anything changes."
                : row.review_status === "changes_requested"
                  ? "Your consultant asked for changes. Read their comment, fix the case, then send it back."
                  : "Ask your labour consultant to check the process before you act."}
          </p>
          {canSendForReview && (
            <SendForReviewForm
              action={requestReview.bind(null, row.id)}
              resend={row.review_status === "changes_requested"}
            />
          )}
        </Card>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <CaseDocuments
            caseId={row.id}
            workflow={workflow}
            documents={view.documents}
            canGenerate
          />
          <CaseRecord workflow={workflow} />
          <CaseIncident
            view={view}
            href={view.incident ? `/app/incidents/${view.incident.id}` : undefined}
          />
          <CaseComments view={view}>
            <CommentForm action={addOwnerComment.bind(null, row.id)} />
          </CaseComments>
        </div>
        <CaseTimeline view={view} className="lg:col-span-2" />
      </div>
    </div>
  );
}
