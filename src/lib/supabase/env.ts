import { z } from "zod";

/**
 * Checks the Supabase settings from `.env.local` (or Vercel) and fails with a
 * clear message naming the variable, instead of a confusing error later.
 */

const publicSchema = z.object({
  url: z.url({
    error: "NEXT_PUBLIC_SUPABASE_URL must be your project URL, e.g. https://xyz.supabase.co",
  }),
  anonKey: z.string({ error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing" }).min(1, {
    error: "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing",
  }),
});

export type PublicEnv = z.infer<typeof publicSchema>;

export function parsePublicEnv(input: { url?: string; anonKey?: string }): PublicEnv {
  const parsed = publicSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      `Supabase is not configured: ${parsed.error.issues[0].message}. See .env.example.`,
    );
  }
  return parsed.data;
}

/** The project URL and publishable key. Safe for the browser. */
export function publicEnv(): PublicEnv {
  // Written out in full so Next.js can inline them into the browser bundle.
  return parsePublicEnv({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function parseServiceRoleKey(value?: string): string {
  if (!value) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing. See .env.example.");
  }
  if (value.startsWith("sb_publishable_")) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY holds the publishable key. Use the secret key (sb_secret_...).",
    );
  }
  return value;
}
