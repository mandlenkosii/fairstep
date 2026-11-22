import {
  Briefcase,
  ClipboardCheck,
  Flag,
  FolderOpen,
  Gavel,
  LayoutDashboard,
  Link2,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";

export type Role = "business_owner" | "consultant" | "admin";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Matches only the exact path, so "/app" isn't active on "/app/cases". */
  exact?: boolean;
};

/** Sidebar links per role. These only shape the UI: access is enforced by RLS and server checks. */
export const SIDEBAR_NAV: Record<Role, NavItem[]> = {
  business_owner: [
    { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/app/employees", label: "Employees", icon: Users },
    { href: "/app/incidents", label: "Incidents", icon: Flag },
    { href: "/app/cases", label: "Cases", icon: Gavel },
  ],
  consultant: [
    { href: "/consultant", label: "Review queue", icon: ClipboardCheck, exact: true },
    { href: "/consultant/clients", label: "Clients", icon: Briefcase },
    { href: "/consultant/cases", label: "All cases", icon: FolderOpen },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/businesses", label: "Businesses", icon: Briefcase },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/assignments", label: "Assignments", icon: Link2 },
  ],
};

/** The big centre button on the owner's mobile tab bar. */
export const PRIMARY_ACTION: Partial<Record<Role, NavItem>> = {
  business_owner: { href: "/app/incidents/new", label: "Log an incident", icon: Plus },
};

export function isActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
