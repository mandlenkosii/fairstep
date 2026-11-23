"use client";

import { AlertCircle, CheckCircle2, MessageSquarePlus, RotateCcw, Send } from "lucide-react";
import { useActionState, useId } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import type { FormState } from "@/lib/forms";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex gap-2 rounded-lg bg-danger-tint px-3 py-2 text-sm text-danger">
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

function BodyField({
  label,
  hint,
  error,
  defaultValue,
}: {
  label: string;
  hint?: string;
  error?: string;
  defaultValue?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <Textarea
        id={id}
        name="body"
        rows={3}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Add a comment to a case (owner or assigned consultant). */
export function CommentForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <FormError message={state.formError} />
      <BodyField
        label="Add a comment"
        error={state.fieldErrors?.body}
        defaultValue={state.values?.body}
      />
      <div>
        <Button type="submit" variant="secondary" pending={pending}>
          <MessageSquarePlus aria-hidden className="size-4" />
          {pending ? "Adding…" : "Add comment"}
        </Button>
      </div>
    </form>
  );
}

/** Owner: send the case to the assigned consultant, with an optional note. */
export function SendForReviewForm({ action, resend }: { action: Action; resend: boolean }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <FormError message={state.formError} />
      <BodyField
        label="Note for your consultant (optional)"
        hint={resend ? "Say what you changed." : "e.g. what you’d like them to check."}
        error={state.fieldErrors?.body}
        defaultValue={state.values?.body}
      />
      <div>
        <Button type="submit" pending={pending}>
          <Send aria-hidden className="size-4" />
          {pending ? "Sending…" : resend ? "Send back for review" : "Send for review"}
        </Button>
      </div>
    </form>
  );
}

/** Consultant: approve, or request changes with a comment saying what to fix. */
export function ReviewDecisionForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <FormError message={state.formError} />
      <BodyField
        label="Comment"
        hint="Required when you request changes. Be specific about what to fix."
        error={state.fieldErrors?.body}
        defaultValue={state.values?.body}
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="decision" value="approve" pending={pending}>
          <CheckCircle2 aria-hidden className="size-4" />
          Approve
        </Button>
        <Button
          type="submit"
          name="decision"
          value="changes"
          variant="secondary"
          disabled={pending}
        >
          <RotateCcw aria-hidden className="size-4" />
          Request changes
        </Button>
      </div>
    </form>
  );
}
