import { ExternalLink, FilePlus2, FileText, Lock } from "lucide-react";
import { generateLetter } from "@/app/app/cases/actions";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { documentReadiness, LETTER_LABEL, type LetterKind } from "@/lib/documents/letters";
import { STEP_ORDER } from "@/lib/workflow/rules.config";
import type { WorkflowCase } from "@/lib/workflow/types";

type Doc = { id: string; kind: string; file_name: string; created_at: string; url?: string | null };

/** Which letters make sense for this case right now. */
function relevantLetters(c: WorkflowCase): LetterKind[] {
  const kinds: LetterKind[] = [];
  if (STEP_ORDER.indexOf(c.currentStep) >= STEP_ORDER.indexOf("notice")) kinds.push("notice");
  const sanction = c.outcome?.sanction;
  if (sanction === "written") kinds.push("warning");
  if (sanction === "final_written") kinds.push("final_warning");
  if (sanction) kinds.push("outcome");
  return kinds;
}

export function CaseDocuments({
  caseId,
  workflow,
  documents,
  canGenerate,
}: {
  caseId: string;
  workflow: WorkflowCase;
  documents: Doc[];
  /** Owners generate letters; consultants only read them. */
  canGenerate: boolean;
}) {
  const now = new Date();
  const letters = canGenerate ? relevantLetters(workflow) : [];

  return (
    <Card>
      <CardTitle>Letters and documents</CardTitle>
      {documents.length ? (
        <ul className="mt-4 flex flex-col gap-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-paper p-3"
            >
              <FileText aria-hidden className="size-5 shrink-0 text-danger" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {LETTER_LABEL[doc.kind as LetterKind] ?? "Case bundle"}
                </p>
                <p className="text-xs text-muted">Generated {formatDateTime(doc.created_at)}</p>
              </div>
              {doc.url && (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-tint"
                >
                  Open
                  <ExternalLink aria-hidden className="size-4" />
                  <span className="sr-only">{doc.file_name} (PDF, opens in a new tab)</span>
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-muted">No letters generated yet.</p>
      )}

      {letters.length > 0 && (
        <ul className="mt-5 flex flex-col gap-3 border-t border-line pt-5">
          {letters.map((kind) => {
            const ready = documentReadiness(workflow, kind, now);
            return (
              <li key={kind}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold">{LETTER_LABEL[kind]}</p>
                  {ready.ok ? (
                    <form action={generateLetter.bind(null, caseId, kind)}>
                      <Button type="submit" variant="secondary">
                        <FilePlus2 aria-hidden className="size-4" />
                        Generate PDF
                      </Button>
                    </form>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-sm text-warning-strong">
                      <Lock aria-hidden className="size-4" />
                      Not ready
                    </span>
                  )}
                </div>
                {!ready.ok && (
                  <ul className="mt-2 flex flex-col gap-1">
                    {ready.reasons.map((reason) => (
                      <li key={reason} className="text-sm text-warning-strong">
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
