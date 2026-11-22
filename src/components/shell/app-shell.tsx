import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { Disclaimer } from "./disclaimer";
import type { Role } from "./nav-config";
import { SidebarNav, TabBar } from "./nav-links";

export type ShellUser = {
  name: string;
  /** e.g. the business name for an owner, or "Labour consultant". */
  subtitle?: string;
};

type AppShellProps = {
  role: Role;
  user: ShellUser;
  /** Extra controls in the user card, such as the log-out button. */
  userAction?: ReactNode;
  children: ReactNode;
};

const HOME: Record<Role, string> = {
  business_owner: "/app",
  consultant: "/consultant",
  admin: "/admin",
};

/**
 * The signed-in layout.
 * Desktop: fixed 248px sidebar with logo, navigation and user card.
 * Mobile: sticky top bar with logo and avatar, plus a bottom tab bar.
 */
export function AppShell({ role, user, userAction, children }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-1">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-62 flex-col border-r border-line bg-surface px-4 py-6 md:flex">
        <Link href={HOME[role]} className="mb-1 px-2">
          <Logo />
        </Link>
        <p className="mb-8 px-2 font-serif text-xs text-muted italic">
          Every step fair. Every step on record.
        </p>
        <SidebarNav role={role} />
        <div className="mt-auto flex items-center gap-3 rounded-xl bg-paper p-3">
          <Avatar name={user.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
            {user.subtitle && <p className="truncate text-xs text-muted">{user.subtitle}</p>}
          </div>
          {userAction}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-62">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-paper/95 px-4 backdrop-blur md:hidden">
          <Link href={HOME[role]}>
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            {userAction}
            <Avatar name={user.name} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>

        <footer className="px-4 pt-2 pb-24 md:pb-6">
          <Disclaimer />
        </footer>
      </div>

      <TabBar role={role} />
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      aria-hidden
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white"
    >
      {initials}
    </span>
  );
}
