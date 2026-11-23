"use client";

import { AlertCircle, Save } from "lucide-react";
import { useActionState, type ReactNode } from "react";
import type { StepFormState } from "@/app/app/cases/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { RecordableStep } from "@/lib/validation/steps";

type Action = (prev: StepFormState, formData: FormData) => Promise<StepFormState>;

const SANCTIONS = [
  ["none", "No sanction (not guilty or no action)"],
  ["verbal", "Verbal warning"],
  ["written", "Written warning"],
  ["final_written", "Final written warning"],
  ["dismissal", "Dismissal"],
] as const;

const RIGHTS = [
  ["representation", "bring a fellow employee or shop steward to represent them"],
  ["interpreter", "have an interpreter"],
  ["witnesses", "call witnesses and question the employer’s witnesses"],
] as const;

/** The form for recording the step a case is on. Saving doesn't move the case on. */
export function StepForm({
  step,
  action,
  defaults,
}: {
  step: RecordableStep;
  action: Action;
  defaults: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  const v = (name: string) => state.values?.[name] ?? defaults[name] ?? "";

  const fields: Record<RecordableStep, ReactNode> = {
    investigation: (
      <>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Who investigated"
            hint="Usually you or a manager."
            error={errors.investigator}
          >
            <Input name="investigator" defaultValue={v("investigator")} />
          </Field>
          <Field
            label="Who raised the complaint"
            hint="The person who reported it. They can’t chair the hearing."
            error={errors.complainant}
          >
            <Input name="complainant" defaultValue={v("complainant")} />
          </Field>
        </div>
        <Field
          label="What the investigation found"
          hint="Facts you checked: CCTV, documents, what witnesses said. Note anything in the employee’s favour too."
          error={errors.findings}
          required
        >
          <Textarea name="findings" rows={6} defaultValue={v("findings")} />
        </Field>
      </>
    ),
    notice: (
      <>
        <Field
          label="Allegations"
          hint="One per line. Say what the employee is alleged to have done, and when."
          error={errors.allegations}
          required
        >
          <Textarea name="allegations" rows={4} defaultValue={v("allegations")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Notice given to the employee"
            hint="When they received it (SAST)."
            error={errors.deliveredAt}
          >
            <Input name="deliveredAt" type="datetime-local" defaultValue={v("deliveredAt")} />
          </Field>
          <Field label="Hearing date and time" hint="SAST." error={errors.hearingAt}>
            <Input name="hearingAt" type="datetime-local" defaultValue={v("hearingAt")} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Venue" error={errors.venue}>
            <Input name="venue" defaultValue={v("venue")} placeholder="e.g. Back office" />
          </Field>
          <Field
            label="Chairperson"
            hint="Someone who wasn’t involved: not the complainant, investigator or a witness."
            error={errors.chairperson}
          >
            <Input name="chairperson" defaultValue={v("chairperson")} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            The notice tells the employee they may
          </legend>
          {RIGHTS.map(([name, label]) => (
            <label key={name} className="flex min-h-11 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                name={name}
                defaultChecked={v(name) === "on"}
                className="size-5 shrink-0 accent-primary"
              />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      </>
    ),
    hearing: (
      <>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            Did the employee attend? <span className="text-danger">*</span>
          </legend>
          <div className="flex flex-wrap gap-6">
            {(
              [
                ["yes", "Yes"],
                ["no", "No"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex min-h-11 cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="employeeAttended"
                  value={value}
                  defaultChecked={v("employeeAttended") === value}
                  className="size-5 accent-primary"
                />
                {label}
              </label>
            ))}
          </div>
          {errors.employeeAttended && (
            <p className="mt-1 text-sm text-danger">{errors.employeeAttended}</p>
          )}
        </fieldset>
        <Field
          label="The employee’s side of the story"
          hint="What they said in response to each allegation."
          error={errors.employeeResponse}
        >
          <Textarea name="employeeResponse" rows={5} defaultValue={v("employeeResponse")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Times the hearing was postponed"
            hint="Because the employee didn’t attend."
            error={errors.postponements}
          >
            <Input
              name="postponements"
              type="number"
              min={0}
              max={10}
              inputMode="numeric"
              defaultValue={v("postponements") || "0"}
            />
          </Field>
          <Field
            label="If there’s no response, why"
            hint="e.g. didn’t attend the postponed hearing and gave no reason."
            error={errors.noResponseReason}
          >
            <Input name="noResponseReason" defaultValue={v("noResponseReason")} />
          </Field>
        </div>
      </>
    ),
    outcome: (
      <>
        <Field label="Outcome" error={errors.sanction} required>
          <Select name="sanction" defaultValue={v("sanction")}>
            <option value="">Choose the outcome</option>
            {SANCTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Reasons"
          hint="Why this outcome is fair: how serious it was, the employee’s record, any circumstances. Needed for a dismissal."
          error={errors.reasons}
        >
          <Textarea name="reasons" rows={5} defaultValue={v("reasons")} />
        </Field>
        <Field
          label="Outcome given to the employee"
          hint="When they received it (SAST). The appeal period starts then."
          error={errors.deliveredAt}
        >
          <Input
            name="deliveredAt"
            type="datetime-local"
            defaultValue={v("deliveredAt")}
            className="sm:max-w-xs"
          />
        </Field>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold">
            Prior warnings you’re relying on (optional)
          </legend>
          <p className="mb-3 text-sm text-muted">
            Written warnings count for 6 months, final warnings for 12.
          </p>
          {[1, 2, 3].map((n) => (
            <div key={n} className="mb-3 grid gap-3 sm:grid-cols-2">
              <Select
                name={`warning${n}Kind`}
                defaultValue={v(`warning${n}Kind`)}
                aria-label={`Warning ${n}: type`}
              >
                <option value="">No warning</option>
                <option value="written">Written warning</option>
                <option value="final_written">Final written warning</option>
              </Select>
              <Input
                name={`warning${n}IssuedOn`}
                type="date"
                aria-label={`Warning ${n}: date given`}
                defaultValue={v(`warning${n}IssuedOn`)}
              />
            </div>
          ))}
        </fieldset>
      </>
    ),
    appeal: (
      <>
        <Field label="Appeal lodged on" hint="SAST." error={errors.lodgedAt}>
          <Input
            name="lodgedAt"
            type="datetime-local"
            defaultValue={v("lodgedAt")}
            className="sm:max-w-xs"
          />
        </Field>
        <Field label="Appeal decision" error={errors.decision}>
          <Textarea name="decision" rows={4} defaultValue={v("decision")} />
        </Field>
      </>
    ),
  };

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state.formError && (
        <p
          role="alert"
          className="flex gap-2 rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {state.formError}
        </p>
      )}
      {fields[step]}
      <div>
        <Button type="submit" pending={pending}>
          <Save aria-hidden className="size-4" />
          {pending ? "Saving…" : "Save details"}
        </Button>
      </div>
    </form>
  );
}
