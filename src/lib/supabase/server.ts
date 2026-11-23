import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * It acts as the logged-in user (from the session cookie), so every query is
 * filtered by Row Level Security. Create a new one per request.
 */
export async function createClient() {
  const { url, anonKey } = publicEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can't set cookies. The proxy (src/proxy.ts)
          // refreshes the session instead, so this is safe to ignore.
        }
      },
    },
  });
}
