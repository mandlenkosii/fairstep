import { z } from "zod";

/** What a server action sends back to a form after a failed submit. */
export type FormState = {
  fieldErrors?: Record<string, string>;
  formError?: string;
  /** What the person typed, so the form keeps it after an error. */
  values?: Record<string, string>;
};

/** Reads the named text fields from a submitted form. */
export function readForm(formData: FormData, keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "")]));
}

/** Turns a zod error into { field: "first message" }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export const SAVE_FAILED = "We couldn't save that. Please try again.";
