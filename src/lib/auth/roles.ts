import type { Role } from "@/components/shell/nav-config";

export type { Role };

/** Where each role lands after logging in. */
export const ROLE_HOME: Record<Role, string> = {
  business_owner: "/app",
  consultant: "/consultant",
  admin: "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  business_owner: "Business owner",
  consultant: "Labour consultant",
  admin: "FairStep admin",
};

export function homeFor(role: Role): string {
  return ROLE_HOME[role];
}

export function isRole(value: unknown): value is Role {
  return value === "business_owner" || value === "consultant" || value === "admin";
}
