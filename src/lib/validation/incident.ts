import { z } from "zod";

/** Plain labels for the misconduct categories (the database stores the keys). */
export const CATEGORY_LABEL = {
  late_coming: "Late coming",
  absenteeism: "Absence without leave",
  dishonesty: "Dishonesty",
  theft: "Theft",
  negligence: "Negligence",
  insubordination: "Insubordination",
  safety: "Safety breach",
  harassment: "Harassment or threats",
  substance_abuse: "Substance abuse",
  damage_to_property: "Damage to property",
  other: "Other",
} as const;

export type IncidentCategory = keyof typeof CATEGORY_LABEL;
const CATEGORIES = Object.keys(CATEGORY_LABEL) as [IncidentCategory, ...IncidentCategory[]];

const MAX_WITNESSES = 10;

/** One witness per line; blank lines ignored. */
export function parseWitnesses(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/\s+/g, " ").slice(0, 120))
    .filter(Boolean)
    .slice(0, MAX_WITNESSES);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// A few minutes' grace for clocks that are slightly out.
const CLOCK_SKEW_MS = 5 * 60 * 1000;

/**
 * Incident form rules. `now` is passed in so "not in the future" is testable.
 * Date and time are entered in SAST and stored as UTC.
 */
export function incidentSchema(now: Date) {
  return z
    .object({
      employeeId: z.string().regex(UUID, { error: "Choose the employee involved." }),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Enter the date it happened." }),
      time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, { error: "Enter the time, like 17:40." }),
      location: z
        .string()
        .trim()
        .min(1, { error: "Enter where it happened." })
        .max(200, { error: "Use 200 characters or fewer." }),
      category: z.enum(CATEGORIES, { error: "Choose a category." }),
      description: z
        .string()
        .trim()
        .min(10, { error: "Describe what happened in at least one full sentence." })
        .max(5000, { error: "Use 5,000 characters or fewer." }),
      witnesses: z.string().transform(parseWitnesses),
    })
    .transform(({ date, time, ...rest }, ctx) => {
      const occurred = new Date(`${date}T${time}:00+02:00`);
      if (Number.isNaN(occurred.getTime())) {
        ctx.addIssue({ code: "custom", path: ["date"], message: "Enter the date it happened." });
        return z.NEVER;
      }
      if (occurred.getTime() > now.getTime() + CLOCK_SKEW_MS) {
        ctx.addIssue({
          code: "custom",
          path: ["date"],
          message: "The incident can't be in the future.",
        });
        return z.NEVER;
      }
      return { ...rest, occurredAt: occurred.toISOString() };
    });
}

export type IncidentInput = z.infer<ReturnType<typeof incidentSchema>>;
export const INCIDENT_FIELDS = [
  "employeeId",
  "date",
  "time",
  "location",
  "category",
  "description",
  "witnesses",
] as const;

// ---------------------------------------------------------------------------
// Evidence files
// ---------------------------------------------------------------------------

export const EVIDENCE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;
export const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024;
export const MAX_EVIDENCE_FILES = 10;

/** Why a file can't be used as evidence, or null if it's fine. Checked in the browser and again on the server. */
export function evidenceProblem(file: { name: string; type: string; size: number }): string | null {
  if (!(EVIDENCE_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name}: only photos (JPG, PNG, WebP, HEIC) and PDFs can be added.`;
  }
  if (file.size <= 0) return `${file.name} is empty.`;
  if (file.size > MAX_EVIDENCE_BYTES) return `${file.name} is larger than 10 MB.`;
  return null;
}

/** Storage path: <business>/incidents/<incident>/<unique>-<safe name>. Storage rules check the business part. */
export function evidencePath(
  businessId: string,
  incidentId: string,
  uniqueId: string,
  fileName: string,
): string {
  const safe = fileName.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-80);
  return `${businessId}/incidents/${incidentId}/${uniqueId}-${safe}`;
}

export const evidenceRecordSchema = z.object({
  path: z.string().min(1).max(400),
  fileName: z.string().trim().min(1).max(200),
  mimeType: z.enum(EVIDENCE_TYPES),
  size: z.number().int().positive().max(MAX_EVIDENCE_BYTES),
});
export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;
