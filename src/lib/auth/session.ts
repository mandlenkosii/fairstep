import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { homeFor, isRole, type Role } from "./roles";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  /** Businesses this user owns or manages (owners only). */
  businesses: { id: string; name: string }[];
};

/**
 * The logged-in user with their profile, or null. Verified with Supabase on
 * every request (never trusted from the browser) and cached for one render.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();
  if (!profile || !isRole(profile.role)) return null;

  let businesses: SessionUser["businesses"] = [];
  if (profile.role === "business_owner") {
    const { data } = await supabase
      .from("business_members")
      .select("businesses (id, name)")
      .eq("user_id", user.id);
    businesses = (data ?? []).flatMap((row) => (row.businesses ? [row.businesses] : []));
  }

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: profile.full_name,
    role: profile.role,
    businesses,
  };
});

/**
 * For pages and server actions: returns the user if they have this role.
 * Not logged in → /login. Wrong role → their own home. This is a real server
 * check; the database (RLS) checks again on every query.
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}

/**
 * For owner pages and actions: the owner and the business they're working in.
 * FairStep's MVP has one business per owner, so it's their first membership.
 */
export async function requireOwnerBusiness() {
  const user = await requireRole("business_owner");
  const business = user.businesses[0];
  if (!business)
    throw new Error("This account isn't linked to a business yet. Contact FairStep support.");
  return { user, business };
}
