import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

/**
 * A friendly "nothing here yet" panel: a soft illustration, a plain sentence
 * about what goes here, and the one thing to do next.
 */
export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="mt-6 flex flex-col items-center px-6 py-12 text-center">
      <EmptyIllustration icon={Icon} />
      <p className="mt-5 font-serif text-headline-sm font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-sm text-muted">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

/** The soft illustration on its own, for empty panels that already have their own text. */
export function EmptyIllustration({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div aria-hidden className="relative animate-rise">
      <span className="absolute inset-0 -m-4 rounded-full bg-primary-tint/70 blur-xl" />
      <span className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-tint to-surface ring-1 ring-line">
        <Icon className="size-9 text-primary" strokeWidth={1.6} />
        <span className="absolute -top-0.5 -right-0.5 size-3.5 rounded-full bg-accent ring-4 ring-surface" />
      </span>
    </div>
  );
}
