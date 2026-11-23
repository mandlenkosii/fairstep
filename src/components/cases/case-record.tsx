import { Card, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime } from "@/lib/format";
import type { WorkflowCase } from "@/lib/workflow/types";

const SANCTION_LABEL: Record<string, string> = {
  none: "No sanction",
  verbal: "Verbal warning",
  written: "Written warning",
  final_written: "Final written warning",
  dismissal: "Dismissal",
};

type Item = [label: string, value: string | undefined];

/** Read-only summary of what has been recorded on the case so far. */
export function CaseRecord({ workflow: c }: { workflow: WorkflowCase }) {
  const sections: [string, Item[]][] = [];

  if (c.investigation?.findings || c.people.complainant) {
    sections.push([
      "Investigation",
      [
        ["Complainant", c.people.complainant],
        ["Investigator", c.people.investigator],
        ["Findings", c.investigation?.findings],
      ],
    ]);
  }
  if (c.notice?.allegations?.length) {
    sections.push([
      "Notice of hearing",
      [
        ["Allegations", c.notice.allegations.join("\n")],
        ["Given to employee", c.notice.deliveredAt && formatDateTime(c.notice.deliveredAt)],
        ["Hearing", c.notice.hearingAt && formatDateTime(c.notice.hearingAt)],
        ["Venue", c.notice.venue],
        ["Chairperson", c.people.chairperson],
      ],
    ]);
  }
  if (c.hearing && c.hearing.employeeAttended !== undefined) {
    sections.push([
      "Hearing",
      [
        ["Employee attended", c.hearing.employeeAttended ? "Yes" : "No"],
        ["Employee’s response", c.hearing.employeeResponse],
        ["Postponements", String(c.hearing.postponements ?? 0)],
        ["Why no response", c.hearing.noResponseReason],
      ],
    ]);
  }
  if (c.outcome?.sanction) {
    sections.push([
      "Outcome",
      [
        ["Outcome", SANCTION_LABEL[c.outcome.sanction]],
        ["Reasons", c.outcome.reasons],
        ["Given to employee", c.outcome.deliveredAt && formatDateTime(c.outcome.deliveredAt)],
        [
          "Prior warnings",
          c.outcome.priorWarnings?.length
            ? c.outcome.priorWarnings
                .map((w) => `${SANCTION_LABEL[w.kind]}, ${formatDate(w.issuedOn)}`)
                .join("\n")
            : undefined,
        ],
      ],
    ]);
  }
  if (c.appeal?.lodgedAt || c.appeal?.decision) {
    sections.push([
      "Appeal",
      [
        ["Lodged", c.appeal.lodgedAt && formatDateTime(c.appeal.lodgedAt)],
        ["Decision", c.appeal.decision],
      ],
    ]);
  }

  return (
    <Card>
      <CardTitle>Case record</CardTitle>
      {sections.length === 0 ? (
        <p className="mt-2 text-muted">Nothing recorded yet beyond the incident.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-5">
          {sections.map(([title, items]) => (
            <div key={title}>
              <h3 className="label-caps text-primary">{title}</h3>
              <dl className="mt-2 flex flex-col gap-2 text-sm">
                {items
                  .filter(([, value]) => value)
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-muted">{label}</dt>
                      <dd className="whitespace-pre-line text-ink">{value}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
