"use client";

import { AlertCircle, ShieldCheck } from "lucide-react";
import { useActionState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import type { FormState } from "@/lib/forms";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

type EmployeeFormProps = {
  action: Action;
  /** Current values when editing. */
  defaults?: Record<string, string>;
  submitLabel: string;
  cancelHref: string;
};

export function EmployeeForm({
  action,
  defaults = {},
  submitLabel,
  cancelHref,
}: EmployeeFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};
  const value = (name: string) => state.values?.[name] ?? defaults[name] ?? "";

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <div className="flex gap-3 rounded-xl bg-info-tint p-4 text-sm text-ink">
        <ShieldCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-info" />
        <p>
          <span className="font-semibold">We only ask for what a case needs (POPIA).</span> No ID
          numbers, home addresses, banking or medical details.
        </p>
      </div>

      {state.formError && (
        <p
          role="alert"
          className="flex gap-2 rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger"
        >
          <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {state.formError}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" error={errors.firstName} required>
          <Input
            name="firstName"
            autoComplete="off"
            defaultValue={value("firstName")}
            placeholder="e.g. Bongani"
          />
        </Field>
        <Field label="Last name" error={errors.lastName} required>
          <Input
            name="lastName"
            autoComplete="off"
            defaultValue={value("lastName")}
            placeholder="e.g. Dube"
          />
        </Field>
      </div>

      <Field
        label="Employee number (optional)"
        hint="Your own staff number, if you use one."
        error={errors.employeeNumber}
      >
        <Input
          name="employeeNumber"
          defaultValue={value("employeeNumber")}
          placeholder="e.g. KK-015"
        />
      </Field>

      <Field label="Job title" error={errors.jobTitle} required>
        <Input name="jobTitle" defaultValue={value("jobTitle")} placeholder="e.g. Waiter" />
      </Field>

      <Field label="Start date" error={errors.startDate} required>
        <Input
          name="startDate"
          type="date"
          defaultValue={value("startDate")}
          className="sm:max-w-xs"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Work phone or WhatsApp (optional)"
          hint="For sending notices."
          error={errors.workPhone}
        >
          <Input
            name="workPhone"
            type="tel"
            inputMode="tel"
            defaultValue={value("workPhone")}
            placeholder="082 123 4567"
          />
        </Field>
        <Field label="Work email (optional)" error={errors.workEmail}>
          <Input
            name="workEmail"
            type="email"
            inputMode="email"
            defaultValue={value("workEmail")}
            placeholder="name@business.co.za"
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="submit" pending={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <ButtonLink href={cancelHref} variant="ghost">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}
