import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  FileText,
  Gavel,
  Image as ImageIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Toast } from "@/components/motion/toast";
import { EvidenceUploader } from "@/components/incidents/evidence-uploader";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { requireOwnerBusiness } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/format";
import { one } from "@/lib/supabase/one";
import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABEL, type IncidentCategory } from "@/lib/validation/incident";
import { startCaseFromIncident } from "../../cases/actions";

export const metadata: Metadata = { title: "Incident" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Evidence links work for 10 minutes, then expire. */
const SIGNED_URL_SECONDS = 600;

export default async function IncidentPage({
  params,
  searchParams,
}: PageProps<"/app/incidents/[id]">) {
  const { business } = await requireOwnerBusiness();
  const { id } = await params;
  const { saved, evidence } = await searchParams;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data: incident } = await supabase
    .from("incidents")
    .select(
      "*, employees (id, first_name, last_name, job_title), reporter:profiles!incidents_reported_by_fkey (full_name), cases (id, reference, current_step)",
    )
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!incident) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, file_name, mime_type, size_bytes, storage_path, created_at")
    .eq("incident_id", id)
    .eq("kind", "evidence")
    .is("archived_at", null)
    .order("created_at");

  const signed = documents?.length
    ? (
        await supabase.storage.from("evidence").createSignedUrls(
          documents.map((d) => d.storage_path),
          SIGNED_URL_SECONDS,
        )
      ).data
    : [];
  const urlFor = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const employee = one(incident.employees);
  const reporter = one(incident.reporter);
  const kase = one(incident.cases);
  const category = CATEGORY_LABEL[incident.category as IncidentCategory];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <Link
        href="/app/incidents"
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Incidents
      </Link>

      {saved === "logged" && <Toast>Incident logged. Well done for writing it down today.</Toast>}
      {evidence === "failed" && (
        <p
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-lg bg-warning-tint px-3 py-2 text-sm text-warning-strong"
        >
          <AlertTriangle aria-hidden className="size-4" />
          Some evidence didn’t upload. Add it again below.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label-caps text-muted">{formatDateTime(incident.occurred_at)}</p>
          <h1 className="mt-1 text-headline-lg">{category}</h1>
          {employee && (
            <p className="mt-1 text-muted">
              <Link
                href={`/app/employees/${employee.id}`}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                {employee.first_name} {employee.last_name}
              </Link>{" "}
              · {employee.job_title}
            </p>
          )}
        </div>
        {kase ? (
          <ButtonLink href={`/app/cases/${kase.id}`} variant="secondary">
            <Gavel aria-hidden className="size-4" />
            Open case {kase.reference}
          </ButtonLink>
        ) : (
          <form action={startCaseFromIncident.bind(null, incident.id)}>
            <Button type="submit">
              <Gavel aria-hidden className="size-4" />
              Start a disciplinary case
            </Button>
          </form>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardTitle>What happened</CardTitle>
          <p className="mt-3 whitespace-pre-line text-ink">{incident.description}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="label-caps text-muted">Location</dt>
              <dd className="mt-1">{incident.location}</dd>
            </div>
            <div>
              <dt className="label-caps text-muted">Logged by</dt>
              <dd className="mt-1">
                {reporter?.full_name ?? "–"}, {formatDateTime(incident.created_at)}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardTitle>Witnesses</CardTitle>
          {incident.witnesses.length ? (
            <ul className="mt-3 flex flex-col gap-2">
              {incident.witnesses.map((witness) => (
                <li key={witness}>{witness}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-muted">None recorded.</p>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardTitle>Supporting evidence</CardTitle>
        {documents?.length ? (
          <ul className="mt-4 flex flex-col gap-2">
            {documents.map((doc) => {
              const url = urlFor.get(doc.storage_path);
              return (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-line bg-paper p-3"
                >
                  {doc.mime_type === "application/pdf" ? (
                    <FileText aria-hidden className="size-5 shrink-0 text-danger" />
                  ) : (
                    <ImageIcon aria-hidden className="size-5 shrink-0 text-primary" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{doc.file_name}</p>
                    <p className="text-xs text-muted">Added {formatDateTime(doc.created_at)}</p>
                  </div>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-tint"
                    >
                      Open
                      <ExternalLink aria-hidden className="size-4" />
                      <span className="sr-only">{doc.file_name} (opens in a new tab)</span>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 mb-4 text-muted">No evidence added yet.</p>
        )}
        <div className="mt-4">
          <EvidenceUploader businessId={business.id} incidentId={incident.id} />
        </div>
      </Card>
    </div>
  );
}
