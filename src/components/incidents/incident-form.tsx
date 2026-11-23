"use client";

import { AlertCircle, Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useId, useState } from "react";
import type { IncidentFormState } from "@/app/app/incidents/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { CATEGORY_LABEL } from "@/lib/validation/incident";
import { EvidencePicker } from "./evidence-picker";
import { uploadEvidence } from "./upload-evidence";

type Action = (prev: IncidentFormState, formData: FormData) => Promise<IncidentFormState>;

type IncidentFormProps = {
  action: Action;
  employees: { id: string; name: string; jobTitle: string }[];
  defaults: { employeeId?: string; date: string; time: string };
};

export function IncidentForm({ action, employees, defaults }: IncidentFormProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string>();

  // One submit: save the incident on the server, upload the evidence from the
  // browser, then open the incident. `pending` stays true for all of it.
  const [state, formAction, pending] = useActionState(
    async (prev: IncidentFormState, formData: FormData) => {
      const result = await action(prev, formData);
      if (!result.saved) return result;
      const { incidentId, businessId, caseId } = result.saved;
      const upload = await uploadEvidence(businessId, incidentId, files);
      if (caseId && !upload.error) {
        router.push(`/app/cases/${caseId}?opened=1`);
      } else {
        const query = upload.error ? "saved=logged&evidence=failed" : "saved=logged";
        router.push(`/app/incidents/${incidentId}?${query}`);
      }
      return result;
    },
    {},
  );
  const categoryErrorId = useId();
  const errors = state.fieldErrors ?? {};
  const value = (name: string, fallback = "") => state.values?.[name] ?? fallback;
  const busy = pending || Boolean(state.saved);
  const uploading = pending && files.length > 0;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {state.formError && (
        <p
          role="alert"
          className="flex gap-2 rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {state.formError}
        </p>
      )}

      <Field label="Employee" error={errors.employeeId} required>
        <Select name="employeeId" defaultValue={value("employeeId", defaults.employeeId)}>
          <option value="">Choose an employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name} · {employee.jobTitle}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Date" error={errors.date} required>
          <Input name="date" type="date" defaultValue={value("date", defaults.date)} />
        </Field>
        <Field label="Time" error={errors.time} required>
          <Input name="time" type="time" defaultValue={value("time", defaults.time)} />
        </Field>
      </div>

      <Field label="Location" error={errors.location} required>
        <Input name="location" defaultValue={value("location")} placeholder="e.g. Front till" />
      </Field>

      <fieldset aria-describedby={errors.category ? categoryErrorId : undefined}>
        <legend className="mb-2 text-sm font-semibold text-ink">
          Category of misconduct <span className="text-danger">*</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
            <label key={key} className="cursor-pointer">
              <input
                type="radio"
                name="category"
                value={key}
                defaultChecked={value("category") === key}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-sm",
                  "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-white",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-accent",
                )}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
        {errors.category && (
          <p id={categoryErrorId} className="mt-2 text-sm text-danger">
            {errors.category}
          </p>
        )}
      </fieldset>

      <Field
        label="What happened"
        hint="Stick to facts: what you saw, heard or can show. Times, amounts and documents help."
        error={errors.description}
        required
      >
        <Textarea
          name="description"
          rows={5}
          defaultValue={value("description")}
          placeholder="e.g. At cash-up the till was R850 short. Lerato was the only cashier from 14:00 to 17:30."
        />
      </Field>

      <Field
        label="Witnesses (optional)"
        hint="One name per line, with their role if it helps."
        error={errors.witnesses}
      >
        <Textarea
          name="witnesses"
          rows={3}
          defaultValue={value("witnesses")}
          placeholder={"Nomvula Zulu (Supervisor)\nSipho Ndlovu"}
        />
      </Field>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Supporting evidence (optional)</p>
        <EvidencePicker
          files={files}
          onChange={setFiles}
          error={fileError}
          onError={setFileError}
          disabled={busy}
        />
      </div>

      <label className="flex cursor-pointer gap-3 rounded-xl border border-primary/30 bg-primary-tint p-4">
        <input
          type="checkbox"
          name="startCase"
          defaultChecked={value("startCase") === "on"}
          className="mt-1 size-5 shrink-0 accent-primary"
        />
        <span>
          <span className="block font-semibold text-ink">
            Start a disciplinary case from this incident
          </span>
          <span className="block text-sm text-muted">
            Opens a case with its own reference and takes you to the investigation step. You can
            also do this later.
          </span>
        </span>
      </label>

      <div className="flex gap-3 rounded-xl bg-warning-tint p-4 text-sm">
        <Lightbulb aria-hidden className="mt-0.5 size-5 shrink-0 text-warning-strong" />
        <p>
          <span className="font-semibold text-warning-strong">Write it down today.</span> A record
          made at the time, with facts rather than opinions, carries the most weight if the case
          ever reaches the CCMA.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" pending={busy}>
          {uploading ? "Saving and uploading…" : pending ? "Saving…" : "Save incident"}
        </Button>
        <ButtonLink href="/app/incidents" variant="ghost" size="lg">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
