import { REVIEW_STATUS, ROLE_SHORT } from "@/lib/cases/labels";
import { formatDate, formatDateTime } from "@/lib/format";
import { STEP_ORDER } from "@/lib/workflow/rules.config";
import type { WorkflowCase } from "@/lib/workflow/types";
import { eventLabel, STEP_LABEL } from "@/lib/workflow/view";
import { LETTER_LABEL, type LetterKind } from "./letters";

/**
 * The "CCMA-ready" case bundle: one document with everything that shows the
 * process was fair. Pure, so its content is tested; the PDF only lays it out.
 */

export type BundleInput = {
  reference: string;
  businessName: string;
  employee: { name: string; jobTitle: string; number?: string | null };
  category: string;
  reviewStatus: string;
  incident: {
    occurredAt: string;
    location: string;
    description: string;
    witnesses: string[];
  } | null;
  workflow: WorkflowCase;
  /** Oldest or newest first; the bundle sorts them. */
  events: {
    type: string;
    payload: unknown;
    createdAt: string;
    actorName: string;
    actorRole: string;
  }[];
  comments: { authorName: string; authorRole: string; body: string; createdAt: string }[];
  documents: { kind: string; fileName: string; createdAt: string }[];
  evidence: { fileName: string; createdAt: string }[];
  generatedAt: Date;
  generatedBy: string;
};

export type Bundle = {
  cover: { title: string; reference: string; lines: string[]; generated: string };
  checklist: {
    step: string;
    status: "Done" | "Current" | "Not reached" | "Not used";
    date: string;
  }[];
  record: { heading: string; items: [string, string][] }[];
  timeline: { when: string; who: string; what: string }[];
  comments: { who: string; when: string; body: string }[];
  evidence: string[];
  documents: string[];
  footer: string;
};

const SANCTION_LABEL: Record<string, string> = {
  none: "No sanction",
  verbal: "Verbal warning",
  written: "Written warning",
  final_written: "Final written warning",
  dismissal: "Dismissal",
};

const person = (name: string, role: string) =>
  ROLE_SHORT[role] ? `${name} (${ROLE_SHORT[role]})` : name;

export function buildBundle(input: BundleInput): Bundle {
  const c = input.workflow;
  const closed = c.currentStep === "closed" || Boolean(c.closedAt);
  const events = [...input.events].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const reachedOn = (step: string) =>
    events.find(
      (e) =>
        e.type === "step.advanced" &&
        typeof e.payload === "object" &&
        e.payload !== null &&
        (e.payload as { to?: unknown }).to === step,
    )?.createdAt;

  const currentIndex = STEP_ORDER.indexOf(c.currentStep);
  const checklist = STEP_ORDER.map((step, index) => {
    const label = STEP_LABEL[step];
    if (step === "incident") {
      return { step: label, status: "Done" as const, date: formatDate(input.incident?.occurredAt) };
    }
    if (step === "appeal" && (closed || index > currentIndex) && !c.appeal?.lodgedAt) {
      return {
        step: label,
        status: closed ? ("Not used" as const) : ("Not reached" as const),
        date: "",
      };
    }
    const date = reachedOn(step);
    if (index < currentIndex || (closed && step === "closed")) {
      return { step: label, status: "Done" as const, date: date ? formatDate(date) : "" };
    }
    if (index === currentIndex) {
      return { step: label, status: "Current" as const, date: date ? formatDate(date) : "" };
    }
    return { step: label, status: "Not reached" as const, date: "" };
  });

  const record: Bundle["record"] = [];
  const push = (heading: string, items: [string, string | undefined][]) => {
    const filled = items.filter((item): item is [string, string] => Boolean(item[1]));
    if (filled.length) record.push({ heading, items: filled });
  };
  if (input.incident) {
    push("Incident", [
      ["When", formatDateTime(input.incident.occurredAt)],
      ["Where", input.incident.location],
      ["What happened", input.incident.description],
      ["Witnesses", input.incident.witnesses.join(", ")],
    ]);
  }
  push("Investigation", [
    ["Complainant", c.people.complainant],
    ["Investigator", c.people.investigator],
    ["Findings", c.investigation?.findings],
  ]);
  push("Notice of hearing", [
    ["Allegations", c.notice?.allegations?.map((a) => `• ${a}`).join("\n")],
    ["Given to employee", c.notice?.deliveredAt && formatDateTime(c.notice.deliveredAt)],
    ["Hearing", c.notice?.hearingAt && formatDateTime(c.notice.hearingAt)],
    ["Venue", c.notice?.venue],
    ["Chairperson", c.people.chairperson],
  ]);
  if (c.hearing && c.hearing.employeeAttended !== undefined) {
    push("Hearing", [
      ["Employee attended", c.hearing.employeeAttended ? "Yes" : "No"],
      ["Employee's response", c.hearing.employeeResponse],
      ["Postponements", String(c.hearing.postponements ?? 0)],
      ["Why no response", c.hearing.noResponseReason],
    ]);
  }
  push("Outcome", [
    ["Outcome", c.outcome?.sanction && SANCTION_LABEL[c.outcome.sanction]],
    ["Reasons", c.outcome?.reasons],
    ["Given to employee", c.outcome?.deliveredAt && formatDateTime(c.outcome.deliveredAt)],
    [
      "Prior warnings relied on",
      c.outcome?.priorWarnings
        ?.map((w) => `${SANCTION_LABEL[w.kind]}, ${formatDate(w.issuedOn)}`)
        .join("\n"),
    ],
  ]);
  push("Appeal", [
    ["Lodged", c.appeal?.lodgedAt && formatDateTime(c.appeal.lodgedAt)],
    ["Decision", c.appeal?.decision],
  ]);

  const review = REVIEW_STATUS[input.reviewStatus] ?? REVIEW_STATUS.not_requested;
  const generatedDate = input.generatedAt.toISOString();

  return {
    cover: {
      title: "Disciplinary case record",
      reference: input.reference,
      lines: [
        `Employer: ${input.businessName}`,
        `Employee: ${input.employee.name}, ${input.employee.jobTitle}${input.employee.number ? ` (${input.employee.number})` : ""}`,
        `Matter: ${input.category}`,
        `Status: ${closed ? "Closed" : `Open, at ${STEP_LABEL[c.currentStep]}`} · ${review.label}`,
      ],
      generated: `Generated on ${formatDate(generatedDate)} at ${formatDateTime(generatedDate).slice(-5)} SAST by ${input.generatedBy}`,
    },
    checklist,
    record,
    timeline: events.map((e) => ({
      when: formatDateTime(e.createdAt),
      who: person(e.actorName, e.actorRole),
      what: eventLabel(e.type, e.payload),
    })),
    comments: input.comments.map((comment) => ({
      who: person(comment.authorName, comment.authorRole),
      when: formatDateTime(comment.createdAt),
      body: comment.body,
    })),
    evidence: input.evidence.map((e) => `${e.fileName} (added ${formatDate(e.createdAt)})`),
    documents: input.documents.map(
      (d) =>
        `${LETTER_LABEL[d.kind as LetterKind] ?? "Document"}: ${d.fileName} (${formatDate(d.createdAt)})`,
    ),
    footer: `${input.reference} · FairStep case record. Timeline entries can't be edited or deleted. FairStep guides process and keeps records. It is not legal advice.`,
  };
}
