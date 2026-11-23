import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  MessageSquare,
} from "lucide-react";
import type { ReactNode } from "react";
import { Stepper } from "@/components/stepper/stepper";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import type { CaseView } from "@/lib/cases/load-case";
import { REVIEW_STATUS, ROLE_SHORT } from "@/lib/cases/labels";
import { formatDate, formatDateTime } from "@/lib/format";
import { CATEGORY_LABEL, type IncidentCategory } from "@/lib/validation/incident";
import { buildStepperSteps, eventLabel, STEP_LABEL } from "@/lib/workflow/view";

/** Pieces shared by the owner's and the consultant's case pages. */

export function Notice({ children }: { children: ReactNode }) {
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

export function CaseHeader({ view, subtitle }: { view: CaseView; subtitle?: string }) {
  const { row, employee, incident } = view;
  const review = REVIEW_STATUS[row.review_status] ?? REVIEW_STATUS.not_requested;
  return (
    <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">{row.reference}</Badge>
          {incident && <Badge>{CATEGORY_LABEL[incident.category as IncidentCategory]}</Badge>}
          <span className="text-sm text-muted">Opened {formatDate(row.created_at)}</span>
        </div>
        <h1 className="mt-2 text-headline-lg">
          {employee ? `${employee.first_name} ${employee.last_name}` : "Case"}
        </h1>
        <p className="text-muted">{[employee?.job_title, subtitle].filter(Boolean).join(" · ")}</p>
      </div>
      <Badge tone={review.tone}>{review.label}</Badge>
    </div>
  );
}

export function CaseStepper({ view }: { view: CaseView }) {
  const closed = view.workflow.currentStep === "closed";
  return (
    <Card className="mt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <p className="label-caps text-muted">Fair steps</p>
        <p className="text-sm font-semibold text-primary">
          {closed ? "Closed" : `Now: ${STEP_LABEL[view.workflow.currentStep]}`}
        </p>
      </div>
      <Stepper steps={buildStepperSteps(view.workflow, new Date())} />
    </Card>
  );
}

export function CaseIncident({ view, href }: { view: CaseView; href?: string }) {
  const { incident, evidence } = view;
  if (!incident) return null;
  return (
    <Card>
      <CardTitle>Incident</CardTitle>
      <p className="mt-1 text-sm text-muted">
        {formatDateTime(incident.occurred_at)} · {incident.location}
      </p>
      <p className="mt-3 whitespace-pre-line">{incident.description}</p>
      {incident.witnesses.length > 0 && (
        <p className="mt-3 text-sm">
          <span className="text-muted">Witnesses: </span>
          {incident.witnesses.join(", ")}
        </p>
      )}
      {evidence.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {evidence.map((doc) => (
            <li key={doc.id}>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-2 hover:underline"
              >
                {doc.mime_type === "application/pdf" ? (
                  <FileText aria-hidden className="size-4" />
                ) : (
                  <ImageIcon aria-hidden className="size-4" />
                )}
                {doc.file_name}
                <ExternalLink aria-hidden className="size-3.5" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      )}
      {href && (
        <a
          href={href}
          className="mt-3 inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          View incident
        </a>
      )}
    </Card>
  );
}

export function CaseComments({ view, children }: { view: CaseView; children?: ReactNode }) {
  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <MessageSquare aria-hidden className="size-5" />
        Comments
      </CardTitle>
      {view.comments.length ? (
        <ul className="mt-3 flex flex-col gap-3">
          {view.comments.map((comment) => (
            <li key={comment.id} className="rounded-lg bg-paper p-3">
              <p className="text-sm font-semibold">
                {comment.author?.full_name ?? "Someone"}{" "}
                <span className="font-normal text-muted">
                  · {ROLE_SHORT[comment.author?.role ?? ""] ?? ""} ·{" "}
                  {formatDateTime(comment.created_at)}
                </span>
              </p>
              <p className="mt-1 text-sm whitespace-pre-line">{comment.body}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-muted">No comments yet.</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </Card>
  );
}

export function CaseTimeline({ view, className }: { view: CaseView; className?: string }) {
  return (
    <Card className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>Timeline</CardTitle>
        <a href={`/cases/${view.row.id}/bundle`} download className={buttonClasses("secondary")}>
          <Download aria-hidden className="size-4" />
          Export case bundle (PDF)
        </a>
      </div>
      <p className="mt-1 text-sm text-muted">
        Every action on this case, who did it and when. Entries can’t be changed.
      </p>
      {view.events.length ? (
        <ol className="mt-4 border-l-2 border-line pl-5">
          {view.events.map((event) => (
            <li key={event.id} className="relative pb-5 last:pb-0">
              <span
                aria-hidden
                className="absolute top-1.5 -left-[27px] size-3 rounded-full bg-primary ring-4 ring-surface"
              />
              <p className="font-semibold">
                {event.actor?.full_name ?? "Someone"}{" "}
                <span className="font-normal">
                  {eventLabel(event.event_type, event.payload).toLowerCase()}
                </span>
              </p>
              <p className="text-sm text-muted">
                {ROLE_SHORT[event.actor?.role ?? ""] ?? ""} · {formatDateTime(event.created_at)}
              </p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-muted">Nothing recorded yet.</p>
      )}
    </Card>
  );
}
