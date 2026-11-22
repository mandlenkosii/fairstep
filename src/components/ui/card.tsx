import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/** White surface with a warm hairline border: the container for most content. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-line bg-surface p-4 shadow-card sm:p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("text-headline-sm", className)} {...props} />;
}
