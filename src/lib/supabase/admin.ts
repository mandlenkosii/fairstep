import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { parseServiceRoleKey, publicEnv } from "./env";

/**
 * Supabase client with the secret key. It BYPASSES Row Level Security, so use
 * it only on the server, only after checking the caller's role yourself
 * (e.g. admin creating a user), and never pass its results to a user unchecked.
 * The `server-only` import makes the build fail if a Client Component imports this.
 */
export function createAdminClient() {
  const { url } = publicEnv();
  const serviceRoleKey = parseServiceRoleKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
