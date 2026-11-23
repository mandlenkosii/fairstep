"use server";

import { redirect } from "next/navigation";
import { authErrorMessage } from "@/lib/auth/errors";
import { homeFor, isRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
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

export async function logIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = readForm(formData, ["email", "password"]);
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values: withoutPassword(values) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return { formError: authErrorMessage(error ?? {}), values: withoutPassword(values) };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  if (!profile || !isRole(profile.role)) {
    await supabase.auth.signOut();
    return { formError: authErrorMessage({}), values: withoutPassword(values) };
  }

  // redirect() works by throwing, so it stays outside any try/catch.
  redirect(homeFor(profile.role));
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const values = readForm(formData, ["fullName", "businessName", "email", "password"]);
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrors(parsed.error), values: withoutPassword(values) };
  }

  const { fullName, businessName, email, password } = parsed.data;
  const supabase = await createClient();
  // The database trigger creates the profile (always as business_owner) and the business.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, business_name: businessName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/login`,
    },
  });
  if (error) {
    return { formError: authErrorMessage(error), values: withoutPassword(values) };
  }
  if (!data.session) {
    // Only happens if email confirmation is switched on in Supabase.
    return {
      formError: "Check your email and click the link to finish creating your account.",
      values: withoutPassword(values),
    };
  }

  redirect(homeFor("business_owner"));
}

export async function logOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
