import { ROLE_HOME, type Role } from "./roles";

const AUTH_PAGES = ["/login", "/signup"];

export type RouteDecision = { type: "next" } | { type: "login" } | { type: "home" };

function isUnder(pathname: string, area: string) {
  return pathname === area || pathname.startsWith(`${area}/`);
}

/**
 * What the proxy should do with a request. `role` is null when signed out.
 * Each role has one area (/app, /consultant, /admin); any other role is sent home.
 */
export function routeDecision(pathname: string, role: Role | null): RouteDecision {
  const area = (Object.entries(ROLE_HOME) as [Role, string][]).find(([, home]) =>
    isUnder(pathname, home),
  );

  if (area) {
    if (!role) return { type: "login" };
    return area[0] === role ? { type: "next" } : { type: "home" };
  }
  if (role && AUTH_PAGES.includes(pathname)) return { type: "home" };
  return { type: "next" };
}
