"use server";

import { fieldErrors, loginSchema, signupSchema } from "@/lib/validation/auth";

export type AuthFormState = {
  fieldErrors?: Record<string, string>;
  formError?: string;
  /** What the person typed (never the password), so the form keeps it after an error. */
  values?: Record<string, string>;
};

function readForm(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, String(formData.get(key) ?? "")]));
}

function withoutPassword(values: Record<string, string>) {
  return Object.fromEntries(Object.entries(values).filter(([key]) => key !== "password"));
}

// The Supabase Auth calls are added in issue #15. Until then the server still
// validates every submission with zod, and valid ones get an honest message.
const NOT_CONNECTED = "Accounts open once the database is connected. Please try again later.";

export async function logIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = readForm(formData, ["email", "password"]);
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values: withoutPassword(values) };
  }
  return { formError: NOT_CONNECTED, values: withoutPassword(values) };
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = readForm(formData, ["fullName", "businessName", "email", "password"]);
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values: withoutPassword(values) };
  }
  return { formError: NOT_CONNECTED, values: withoutPassword(values) };
}
