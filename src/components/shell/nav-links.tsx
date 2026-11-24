"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { PRIMARY_ACTION, SIDEBAR_NAV, isActive, type Role } from "./nav-config";

/** Desktop sidebar links. Client component because it reads the current URL. */
export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {SIDEBAR_NAV[role].map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
              active ? "text-primary" : "text-ink hover:bg-paper",
            )}
          >
            {active && (
              // Slides from the old item to the new one when you change page.
              <motion.span
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-lg bg-primary-tint"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              >
                <span className="absolute top-2.5 bottom-2.5 left-0 w-1 rounded-r-full bg-accent" />
              </motion.span>
            )}
            <Icon aria-hidden className="relative size-5" />
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Mobile bottom tab bar, with a raised centre button for the owner's main action. */
export function TabBar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = SIDEBAR_NAV[role];
  const action = PRIMARY_ACTION[role];
  const middle = Math.ceil(items.length / 2);

  const tab = (item: (typeof items)[number]) => {
    const active = isActive(item, pathname);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
          active ? "text-primary" : "text-muted",
        )}
      >
        <Icon aria-hidden className="size-5" />
        {item.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Tabs"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="mx-auto flex max-w-lg items-end px-2">
        {items.slice(0, middle).map(tab)}
        {action && (
          <Link
            href={action.href}
            aria-label={action.label}
            className="-mt-5 mb-1 flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-paper"
          >
            <action.icon aria-hidden className="size-6" />
          </Link>
        )}
        {items.slice(middle).map(tab)}
      </div>
    </nav>
  );
}
