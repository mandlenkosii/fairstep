import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

// Text colours meet WCAG AA (4.5:1) on their tint backgrounds.
const tones: Record<BadgeTone, string> = {
  neutral: "bg-paper text-muted ring-line",
  primary: "bg-primary-tint text-primary ring-primary/20",
  success: "bg-success-tint text-success-strong ring-success/20",
  warning: "bg-warning-tint text-warning-strong ring-warning/25",
  danger: "bg-danger-tint text-danger ring-danger/20",
  info: "bg-info-tint text-info ring-info/20",
};

type BadgeProps = { tone?: BadgeTone; className?: string; children: ReactNode };

export function Badge({ tone = "neutral", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
