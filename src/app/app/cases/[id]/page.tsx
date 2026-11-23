import { ArrowLeft, ArrowRight, CheckCircle2, Lock, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Stepper } from "@/components/stepper/stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { requireOwnerBusiness } from "@/lib/auth/session";
import { REVIEW_STATUS, ROLE_SHORT } from "@/lib/cases/labels";
import { formatDate, formatDateTime } from "@/lib/format";
import { one } from "@/lib/supabase/one";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABEL, type IncidentCategory } from "@/lib/validation/incident";
import { canTransition, nextSteps } from "@/lib/workflow/rules";
import type { Step } from "@/lib/workflow/types";
import { buildStepperSteps, caseToWorkflow, eventLabel, STEP_LABEL } from "@/lib/workflow/view";
import { advanceCase, saveStep } from "../actions";
import { CaseDocuments } from "@/components/cases/case-documents";
import { CaseRecord } from "@/components/cases/case-record";
import { LETTER_LABEL, type LetterKind } from "@/lib/documents/letters";
import { StepForm } from "@/components/cases/step-form";
import { RECORDABLE_STEPS, stepDefaults, type RecordableStep } from "@/lib/validation/steps";

export const metadata: Metadata = { title: "Case" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CasePage({ params, searchParams }: PageProps<"/app/cases/[id]">) {
  const { business } = await requireOwnerBusiness();
  const { id } = await params;
  const query = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("cases")
    .select(
      "*, employee:employees (id, first_name, last_name, job_title), incident:incidents (id, occurred_at, witnesses, category, location, description)",
    )
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!row) notFound();

  const [{ data: events }, { data: comments }, { data: docs }] = await Promise.all([
    supabase
      .from("case_events")
      .select("id, event_type, payload, created_at, actor:profiles (full_name, role)")
      .eq("case_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select("id, body, created_at, author:profiles (full_name, role)")
      .eq("case_id", id)
      .order("created_at"),
    supabase
      .from("documents")
      .select("id, kind, file_name, created_at, storage_path")
      .eq("case_id", id)
      .neq("kind", "evidence")
      .is("archived_at", null)
      .order("created_at", { ascending: false }),
  ]);
  // Private files: links that expire after 10 minutes.
  const signed = docs?.length
    ? (
        await supabase.storage.from("documents").createSignedUrls(
          docs.map((d) => d.storage_path),
          600,
        )
      ).data
    : [];
  const urlFor = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));
  const documents = (docs ?? []).map((d) => ({ ...d, url: urlFor.get(d.storage_path) }));

  const employee = one(row.employee);
  const incident = one(row.incident);
  const now = new Date();
  const workflow = caseToWorkflow({ ...row, incident });
  const steps = buildStepperSteps(workflow, now);
  const closed = workflow.currentStep === "closed";
  const options = closed
    ? []
    : nextSteps(workflow.currentStep).map((to) => ({
        to,
        result: canTransition(workflow, to, now),
      }));
  const review = REVIEW_STATUS[row.review_status] ?? REVIEW_STATUS.not_requested;
  const moved = typeof query.moved === "string" ? STEP_LABEL[query.moved as Step] : undefined;
  const recorded =
    typeof query.recorded === "string" ? STEP_LABEL[query.recorded as Step] : undefined;
  const recordable = (RECORDABLE_STEPS as string[]).includes(workflow.currentStep)
    ? (workflow.currentStep as RecordableStep)
    : null;

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
      {moved && <Notice>Case moved to {moved}.</Notice>}
      {recorded && <Notice>{recorded} details saved. Check what’s next below.</Notice>}
      {typeof query.generated === "string" && (
        <Notice>
          {LETTER_LABEL[query.generated as LetterKind] ?? "Document"} generated. Open it below,
          print it and give it to the employee.
        </Notice>
      )}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{row.reference}</Badge>
            {incident && <Badge>{CATEGORY_LABEL[incident.category as IncidentCategory]}</Badge>}
            <span className="text-sm text-muted">Opened {formatDate(row.created_at)}</span>
          </div>
          <h1 className="mt-2 text-headline-lg">
            {employee ? `${employee.first_name} ${employee.last_name}` : "Case"}
          </h1>
          {employee && <p className="text-muted">{employee.job_title}</p>}
        </div>
        <Badge tone={review.tone}>{review.label}</Badge>
      </div>

      <Card className="mt-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
          <p className="label-caps text-muted">Fair steps</p>
          <p className="text-sm font-semibold text-primary">
            {closed ? "Closed" : `Now: ${STEP_LABEL[workflow.currentStep]}`}
          </p>
        </div>
        <Stepper steps={steps} />
      </Card>

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
              notes.
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

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <CaseDocuments caseId={row.id} workflow={workflow} documents={documents} canGenerate />
          <CaseRecord workflow={workflow} />
          {incident && (
            <Card>
              <CardTitle>Incident</CardTitle>
              <p className="mt-1 text-sm text-muted">
                {formatDateTime(incident.occurred_at)} · {incident.location}
              </p>
              <p className="mt-3 line-clamp-5 whitespace-pre-line">{incident.description}</p>
              <Link
                href={`/app/incidents/${incident.id}`}
                className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline"
              >
                View incident and evidence
              </Link>
            </Card>
          )}
          <Card>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare aria-hidden className="size-5" />
              Comments
            </CardTitle>
            {comments?.length ? (
              <ul className="mt-3 flex flex-col gap-3">
                {comments.map((comment) => {
                  const author = one(comment.author);
                  return (
                    <li key={comment.id} className="rounded-lg bg-paper p-3">
                      <p className="text-sm font-semibold">
                        {author?.full_name ?? "Someone"}{" "}
                        <span className="font-normal text-muted">
                          · {ROLE_SHORT[author?.role ?? ""] ?? ""} ·{" "}
                          {formatDateTime(comment.created_at)}
                        </span>
                      </p>
                      <p className="mt-1 text-sm whitespace-pre-line">{comment.body}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-muted">No comments yet.</p>
            )}
          </Card>
        </div>

        <Card className="lg:col-span-2">
          <CardTitle>Timeline</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Every action on this case, who did it and when. Entries can’t be changed.
          </p>
          {events?.length ? (
            <ol className="mt-4 border-l-2 border-line pl-5">
              {events.map((event) => {
                const actor = one(event.actor);
                return (
                  <li key={event.id} className="relative pb-5 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute top-1.5 -left-[27px] size-3 rounded-full bg-primary ring-4 ring-surface"
                    />
                    <p className="font-semibold">
                      {actor?.full_name ?? "Someone"}{" "}
                      <span className="font-normal">
                        {eventLabel(event.event_type, event.payload).toLowerCase()}
                      </span>
                    </p>
                    <p className="text-sm text-muted">
                      {ROLE_SHORT[actor?.role ?? ""] ?? ""} · {formatDateTime(event.created_at)}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-2 text-muted">Nothing recorded yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      className="mt-4 flex items-center gap-2 rounded-lg bg-success-tint px-3 py-2 text-sm text-success-strong"
    >
      <CheckCircle2 aria-hidden className="size-4 shrink-0" />
      {children}
    </p>
  );
}
