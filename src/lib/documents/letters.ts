import { formatDate } from "@/lib/format";
import { addMonths, toSastDate } from "@/lib/workflow/dates";
import { appealDeadline, canTransition } from "@/lib/workflow/rules";
import {
  APPEAL_WINDOW_WORKING_DAYS,
  FINAL_WARNING_VALID_MONTHS,
  WRITTEN_WARNING_VALID_MONTHS,
} from "@/lib/workflow/rules.config";
import type { WorkflowCase } from "@/lib/workflow/types";

/**
 * What each letter says, built from the case. Pure, so the wording is tested;
 * the PDF template only lays it out. Wording is plain SA English and is
 * guidance only, not legal advice.
 */

export type LetterKind = "notice" | "warning" | "final_warning" | "outcome";

export const LETTER_LABEL: Record<LetterKind, string> = {
  notice: "Notice of hearing",
  warning: "Written warning",
  final_warning: "Final written warning",
  outcome: "Outcome letter",
};

export type LetterSection = { heading: string; paragraphs?: string[]; bullets?: string[] };

export type Letter = {
  title: string;
  businessName: string;
  to: string;
  date: string;
  reference: string;
  lead: string;
  sections: LetterSection[];
  signatures: [string, string];
  footer: string;
};

export type LetterInput = {
  business: { name: string };
  employee: { name: string; jobTitle: string; number?: string | null };
  reference: string;
  issuedBy: string;
  workflow: WorkflowCase;
  generatedAt: Date;
};

// ---------------------------------------------------------------------------
// Dates in SAST
// ---------------------------------------------------------------------------

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function sast(value: string | Date) {
  return new Date(new Date(value).getTime() + 2 * 60 * 60 * 1000);
}
/** "23 November 2026" */
function longDate(value: string | Date) {
  const [y, m, d] = toSastDate(value).split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
/** "Thursday 26 November 2026" */
function dayDate(value: string | Date) {
  return `${DAYS[sast(value).getUTCDay()]} ${longDate(value)}`;
}
/** "10:00" */
function time(value: string | Date) {
  return sast(value).toISOString().slice(11, 16);
}

// ---------------------------------------------------------------------------
// When a letter may be generated
// ---------------------------------------------------------------------------

export function documentReadiness(
  c: WorkflowCase,
  kind: LetterKind,
  now: Date,
): { ok: true } | { ok: false; reasons: string[] } {
  const reasons: string[] = [];

  if (kind === "notice") {
    // R2: findings recorded. R3–R5: complete notice, enough notice, impartial chair.
    if (!c.investigation?.findings?.trim()) {
      reasons.push(
        "Record what you found in your investigation first, so the allegations are clear.",
      );
    }
    const notice = { ...c.notice, deliveredAt: c.notice?.deliveredAt ?? now.toISOString() };
    const check = canTransition(
      { ...c, currentStep: "notice", closedAt: null, notice },
      "hearing",
      now,
    );
    if (!check.ok) reasons.push(...check.reasons.map((r) => r.message));
  } else {
    const sanction = c.outcome?.sanction;
    if (!sanction) return { ok: false, reasons: ["Record the outcome of the hearing first."] };
    if (kind === "warning" && sanction !== "written") {
      reasons.push("The recorded outcome isn't a written warning.");
    }
    if (kind === "final_warning" && sanction !== "final_written") {
      reasons.push("The recorded outcome isn't a final written warning.");
    }
    // R8 and R10: reasons for a dismissal, no expired warnings counted.
    const check = canTransition({ ...c, currentStep: "outcome", closedAt: null }, "closed", now);
    if (!check.ok) reasons.push(...check.reasons.map((r) => r.message));
  }

  return reasons.length ? { ok: false, reasons } : { ok: true };
}

// ---------------------------------------------------------------------------
// Letter content
// ---------------------------------------------------------------------------

const SANCTION_WORDS: Record<string, string> = {
  none: "no disciplinary action",
  verbal: "a verbal warning",
  written: "a written warning",
  final_written: "a final written warning",
  dismissal: "dismissal",
};

function appealSection(c: WorkflowCase): LetterSection {
  const deadline = c.outcome?.deliveredAt ? appealDeadline(c.outcome.deliveredAt) : null;
  return {
    heading: "Your right to appeal",
    paragraphs: [
      deadline
        ? `If you disagree with this outcome, you may appeal in writing within ${APPEAL_WINDOW_WORKING_DAYS} working days, by ${dayDate(deadline)}. Give your appeal to the business owner and say why you think the outcome is unfair.`
        : `If you disagree with this outcome, you may appeal in writing within ${APPEAL_WINDOW_WORKING_DAYS} working days of receiving this letter. Give your appeal to the business owner and say why you think the outcome is unfair.`,
    ],
  };
}

function hearingLine(c: WorkflowCase) {
  return c.notice?.hearingAt
    ? `following the disciplinary hearing held on ${dayDate(c.notice.hearingAt)}`
    : "following a disciplinary process";
}

export function buildLetter(kind: LetterKind, input: LetterInput): Letter {
  const { workflow: c, employee } = input;
  const base = {
    businessName: input.business.name,
    to: `${employee.name}, ${employee.jobTitle}${employee.number ? ` (${employee.number})` : ""}`,
    date: longDate(input.generatedAt),
    reference: input.reference,
    signatures: [`Issued by ${input.issuedBy}`, "Received by employee: signature and date"] as [
      string,
      string,
    ],
    footer: `Generated by FairStep on ${formatDate(input.generatedAt.toISOString())} at ${time(input.generatedAt)} SAST. FairStep guides process and keeps records. It is not legal advice.`,
  };
  const allegations: LetterSection = {
    heading: "Allegations",
    bullets: c.notice?.allegations ?? [],
  };

  if (kind === "notice") {
    const rights = c.notice?.rights;
    const bullets = [
      rights?.representation && "to be represented by a fellow employee or shop steward",
      rights?.interpreter && "to an interpreter, in a language you understand",
      rights?.witnesses && "to call witnesses and present evidence",
      rights?.witnesses && "to question the employer's witnesses",
    ].filter((item): item is string => Boolean(item));
    const when = c.notice?.hearingAt
      ? `on ${dayDate(c.notice.hearingAt)} at ${time(c.notice.hearingAt)}`
      : "on a date we will confirm";
    return {
      ...base,
      title: "Notice to attend a disciplinary hearing",
      lead: `You are required to attend a disciplinary hearing ${when}${c.notice?.venue ? `, at ${c.notice.venue}` : ""}.`,
      sections: [
        allegations,
        { heading: "Your rights", paragraphs: ["At the hearing you have the right:"], bullets },
        {
          heading: "The hearing",
          paragraphs: [
            c.people.chairperson
              ? `The hearing will be chaired by ${c.people.chairperson}, who was not involved in the incident.`
              : "The hearing will be chaired by someone who was not involved in the incident.",
            "You will be able to answer each allegation and give your side of the story before any decision is made.",
            "If you cannot attend for a good reason, tell us as soon as possible. If you do not attend without a good reason, the hearing may be postponed once and then continue without you.",
          ],
        },
      ],
    };
  }

  if (kind === "warning" || kind === "final_warning") {
    const final = kind === "final_warning";
    const months = final ? FINAL_WARNING_VALID_MONTHS : WRITTEN_WARNING_VALID_MONTHS;
    const from = c.outcome?.deliveredAt ?? input.generatedAt.toISOString();
    const until = addMonths(toSastDate(from), months);
    return {
      ...base,
      title: final ? "Final written warning" : "Written warning",
      lead: `This is a ${final ? "final written" : "written"} warning, ${hearingLine(c)}.`,
      sections: [
        allegations,
        ...(c.outcome?.reasons ? [{ heading: "Reasons", paragraphs: [c.outcome.reasons] }] : []),
        {
          heading: "What this means",
          paragraphs: [
            `This warning is valid for ${months} months, until ${longDate(until)}.`,
            final
              ? "If you commit a similar offence while this warning is valid, it may lead to dismissal after a fair hearing."
              : "If you commit a similar offence while this warning is valid, more serious action may follow after a fair hearing.",
          ],
        },
        appealSection(c),
      ],
    };
  }

  const sanction = c.outcome?.sanction ?? "none";
  const response = c.hearing?.employeeResponse ?? c.hearing?.noResponseReason;
  return {
    ...base,
    title: "Outcome of disciplinary hearing",
    lead: `This letter confirms the outcome ${hearingLine(c)}. The outcome is: ${SANCTION_WORDS[sanction]}.`,
    sections: [
      allegations,
      ...(response ? [{ heading: "Your response", paragraphs: [response] }] : []),
      ...(c.outcome?.reasons
        ? [{ heading: "Reasons for the outcome", paragraphs: [c.outcome.reasons] }]
        : []),
      appealSection(c),
      ...(sanction === "dismissal"
        ? [
            {
              heading: "Referring a dispute",
              paragraphs: [
                "If you believe your dismissal is unfair, you may also refer a dispute to the CCMA within 30 days of the date of dismissal.",
              ],
            },
          ]
        : []),
    ],
  };
}
