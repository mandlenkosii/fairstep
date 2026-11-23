import { z } from "zod";
import { fieldErrors } from "@/lib/forms";

/**
 * Form rules for recording each step of a case. A step's details are stored in
 * cases.step_data[step]; a few are also kept in their own columns (complainant,
 * chairperson, hearing time, outcome) for lists and filters.
 *
 * Saving checks that the form makes sense. Whether the case may MOVE ON is a
 * separate question answered by the workflow rules (canTransition), so an owner
 * can save a draft and see exactly what is still blocking the next step.
 */

const SAST_OFFSET = "+02:00";

/** "2026-11-26T10:00" typed in SAST → UTC ISO string. */
export function sastInputToUtc(value: string): string {
  return new Date(`${value}:00${SAST_OFFSET}`).toISOString();
}

/** UTC ISO string → "2026-11-26T10:00" for a datetime-local input in SAST. */
export function utcToSastInput(value: string | undefined | null): string {
  if (!value) return "";
  return new Date(new Date(value).getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Use ${max} characters or fewer.` });
const optionalText = (max: number) =>
  text(max).transform((value) => (value === "" ? undefined : value));
const required = (message: string, max: number) => text(max).min(1, { error: message });
const optionalDateTime = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value), {
    error: "Enter a date and time.",
  })
  .transform((value) => (value === "" ? undefined : sastInputToUtc(value)));
const checkbox = z
  .string()
  .optional()
  .transform((value) => value === "on");
const lines = (max: number) =>
  z.string().transform((value) =>
    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, max),
  );

const investigation = z
  .object({
    investigator: optionalText(120),
    complainant: optionalText(120),
    findings: required("Write down what the investigation found.", 5000),
  })
  .transform(({ complainant, ...section }) => ({
    section,
    columns: { complainant_name: complainant ?? null },
  }));

const notice = z
  .object({
    allegations: lines(10).refine((list) => list.length > 0, {
      error: "List at least one allegation.",
    }),
    deliveredAt: optionalDateTime,
    hearingAt: optionalDateTime,
    venue: optionalText(200),
    chairperson: optionalText(120),
    representation: checkbox,
    interpreter: checkbox,
    witnesses: checkbox,
  })
  .transform(({ chairperson, representation, interpreter, witnesses, ...section }) => ({
    section: { ...section, rights: { representation, interpreter, witnesses } },
    columns: { chairperson_name: chairperson ?? null, hearing_at: section.hearingAt ?? null },
  }));

const hearing = z
  .object({
    employeeAttended: z.enum(["yes", "no"], { error: "Say whether the employee attended." }),
    employeeResponse: optionalText(5000).optional(),
    noResponseReason: optionalText(1000).optional(),
    postponements: z.coerce
      .number({ error: "Enter a number." })
      .int()
      .min(0, { error: "Enter 0 or more." })
      .max(10, { error: "Enter 10 or fewer." }),
  })
  .transform(({ employeeAttended, ...rest }) => ({
    section: { employeeAttended: employeeAttended === "yes", ...rest },
    columns: {},
  }));

const warning = (n: 1 | 2 | 3) => ({
  [`warning${n}Kind`]: z.enum(["", "written", "final_written"]).optional(),
  [`warning${n}IssuedOn`]: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), { error: "Enter the date." }),
});

const outcome = z
  .object({
    sanction: z.enum(["none", "verbal", "written", "final_written", "dismissal"], {
      error: "Choose the outcome.",
    }),
    reasons: optionalText(5000).optional(),
    deliveredAt: optionalDateTime.optional(),
    ...warning(1),
    ...warning(2),
    ...warning(3),
  })
  .transform((value) => {
    const record = value as Record<string, string | undefined>;
    const priorWarnings = [1, 2, 3].flatMap((n) => {
      const kind = record[`warning${n}Kind`];
      const issuedOn = record[`warning${n}IssuedOn`];
      return kind && issuedOn ? [{ kind: kind as "written" | "final_written", issuedOn }] : [];
    });
    return {
      section: {
        sanction: value.sanction,
        reasons: value.reasons,
        deliveredAt: value.deliveredAt,
        priorWarnings,
      },
      columns: { outcome: value.sanction },
    };
  });

const appeal = z
  .object({
    lodgedAt: optionalDateTime,
    decision: optionalText(5000).optional(),
  })
  .transform((section) => ({ section, columns: {} }));

export const STEP_SCHEMAS = { investigation, notice, hearing, outcome, appeal } as const;
export type RecordableStep = keyof typeof STEP_SCHEMAS;
export const RECORDABLE_STEPS = Object.keys(STEP_SCHEMAS) as RecordableStep[];

export type StepData = {
  section: Record<string, unknown>;
  columns: Record<string, string | null>;
};

/** Field names each step's form sends. */
export const STEP_FIELDS: Record<RecordableStep, string[]> = {
  investigation: ["investigator", "complainant", "findings"],
  notice: [
    "allegations",
    "deliveredAt",
    "hearingAt",
    "venue",
    "chairperson",
    "representation",
    "interpreter",
    "witnesses",
  ],
  hearing: ["employeeAttended", "employeeResponse", "noResponseReason", "postponements"],
  outcome: [
    "sanction",
    "reasons",
    "deliveredAt",
    "warning1Kind",
    "warning1IssuedOn",
    "warning2Kind",
    "warning2IssuedOn",
    "warning3Kind",
    "warning3IssuedOn",
  ],
  appeal: ["lodgedAt", "decision"],
};

export function parseStep(
  step: RecordableStep,
  values: Record<string, string | undefined>,
): { ok: true; data: StepData } | { ok: false; fieldErrors: Record<string, string> } {
  const parsed = STEP_SCHEMAS[step].safeParse(values);
  if (!parsed.success) return { ok: false, fieldErrors: fieldErrors(parsed.error) };
  return { ok: true, data: parsed.data as StepData };
}

/** Saved values as form defaults (times shown in SAST). New notices start with all rights ticked. */
export function stepDefaults(
  step: RecordableStep,
  row: { step_data: unknown; complainant_name: string | null; chairperson_name: string | null },
): Record<string, string> {
  const all = row.step_data && typeof row.step_data === "object" ? row.step_data : {};
  const s = ((all as Record<string, unknown>)[step] ?? {}) as Record<string, unknown>;
  const str = (value: unknown) => (typeof value === "string" ? value : "");

  switch (step) {
    case "investigation":
      return {
        investigator: str(s.investigator),
        complainant: row.complainant_name ?? "",
        findings: str(s.findings),
      };
    case "notice": {
      const rights = (s.rights ?? {
        representation: true,
        interpreter: true,
        witnesses: true,
      }) as Record<string, boolean>;
      return {
        allegations: Array.isArray(s.allegations) ? s.allegations.join("\n") : "",
        deliveredAt: utcToSastInput(str(s.deliveredAt)),
        hearingAt: utcToSastInput(str(s.hearingAt)),
        venue: str(s.venue),
        chairperson: row.chairperson_name ?? "",
        representation: rights.representation ? "on" : "",
        interpreter: rights.interpreter ? "on" : "",
        witnesses: rights.witnesses ? "on" : "",
      };
    }
    case "hearing":
      return {
        employeeAttended:
          s.employeeAttended === true ? "yes" : s.employeeAttended === false ? "no" : "",
        employeeResponse: str(s.employeeResponse),
        noResponseReason: str(s.noResponseReason),
        postponements: String(typeof s.postponements === "number" ? s.postponements : 0),
      };
    case "outcome": {
      const warnings = Array.isArray(s.priorWarnings)
        ? (s.priorWarnings as { kind: string; issuedOn: string }[])
        : [];
      const values: Record<string, string> = {
        sanction: str(s.sanction),
        reasons: str(s.reasons),
        deliveredAt: utcToSastInput(str(s.deliveredAt)),
      };
      warnings.slice(0, 3).forEach((warning, i) => {
        values[`warning${i + 1}Kind`] = warning.kind;
        values[`warning${i + 1}IssuedOn`] = warning.issuedOn;
      });
      return values;
    }
    case "appeal":
      return { lodgedAt: utcToSastInput(str(s.lodgedAt)), decision: str(s.decision) };
  }
}
