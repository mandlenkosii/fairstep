import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { publicEnv } from "./env";

/**
 * Supabase client for Client Components. It only has the publishable key,
 * so it can do nothing that Row Level Security doesn't allow for the user.
 */
export function createClient() {
  const { url, anonKey } = publicEnv();
  return createBrowserClient<Database>(url, anonKey);
}
