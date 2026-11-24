import { cn } from "@/lib/cn";

/**
 * Soft, slowly drifting light behind a section (after Aceternity's aurora
 * backgrounds), in FairStep's teal and ochre. Purely decorative; it stops
 * moving for anyone who prefers reduced motion.
 */
export function Aurora({
  className,
  tone = "light",
}: {
  className?: string;
  /** "light" for paper backgrounds, "dark" for the teal brand panel. */
  tone?: "light" | "dark";
}) {
  const teal = tone === "light" ? "bg-primary/15" : "bg-white/15";
  const ochre = tone === "light" ? "bg-accent/20" : "bg-accent/25";
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}
    >
      <div
        className={cn(
          "absolute -top-1/4 -left-1/4 size-[70%] animate-drift rounded-full blur-3xl",
          teal,
        )}
      />
      <div
        className={cn(
          "absolute -right-1/4 -bottom-1/3 size-[60%] animate-drift-slow rounded-full blur-3xl",
          ochre,
        )}
      />
      <div
        className={cn(
          "absolute top-1/3 left-1/2 size-[35%] animate-drift rounded-full blur-3xl",
          teal,
        )}
      />
    </div>
  );
}
