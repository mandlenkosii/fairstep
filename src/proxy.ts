import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { homeFor, isRole, type Role } from "@/lib/auth/roles";
import { routeDecision } from "@/lib/auth/routes";
import type { Database } from "@/lib/supabase/database.types";
import { publicEnv } from "@/lib/supabase/env";

/**
 * Runs before every page request:
 * 1. Refreshes the Supabase session and writes the new cookies, so people
 *    stay logged in.
 * 2. Sends signed-out visitors from /app, /consultant and /admin to /login,
 *    the wrong role to its own home, and signed-in users from /login and
 *    /signup to their home.
 * This is the first gate only. Every page checks the role again on the server
 * (requireRole), and the database checks every query (RLS).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = publicEnv();

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Don't put code between createServerClient and getUser: getUser refreshes the session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: Role | null = null;
  if (user) {
    // RLS lets users read their own profile; a primary-key lookup is fast.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile && isRole(profile.role) ? profile.role : null;
  }

  const decision = routeDecision(request.nextUrl.pathname, role);
  if (decision.type === "next") return response;

  const destination = decision.type === "home" && role ? homeFor(role) : "/login";
  const redirect = NextResponse.redirect(new URL(destination, request.url));
  // Keep any refreshed session cookies on the redirect.
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  matcher: ["/app/:path*", "/consultant/:path*", "/admin/:path*", "/login", "/signup"],
};
