"use client";

import { AlertCircle } from "lucide-react";
import { useActionState } from "react";
import type { AuthFormState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

type Action = (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex gap-2 rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger">
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

export function LoginForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <FormError message={state.formError} />
      <Field label="Work email" error={errors.email}>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values?.email}
        />
      </Field>
      <Field label="Password" error={errors.password}>
        <Input name="password" type="password" autoComplete="current-password" />
      </Field>
      <Button type="submit" size="lg" pending={pending} className="mt-2 w-full">
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}

export function SignupForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <FormError message={state.formError} />
      <Field label="Your name" error={errors.fullName} required>
        <Input name="fullName" autoComplete="name" defaultValue={state.values?.fullName} />
      </Field>
      <Field label="Business name" error={errors.businessName} required>
        <Input
          name="businessName"
          autoComplete="organization"
          defaultValue={state.values?.businessName}
        />
      </Field>
      <Field label="Work email" error={errors.email} required>
        <Input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.values?.email}
        />
      </Field>
      <Field label="Password" hint="At least 8 characters." error={errors.password} required>
        <Input name="password" type="password" autoComplete="new-password" />
      </Field>
      <Button type="submit" size="lg" pending={pending} className="mt-2 w-full">
        {pending ? "Creating your account…" : "Start your free trial"}
      </Button>
    </form>
  );
}
