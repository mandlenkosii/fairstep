import { cn } from "@/lib/cn";

export const DISCLAIMER = "FairStep guides process and keeps records. It is not legal advice.";

/** Required on every screen: FairStep is process guidance, not legal advice. */
export function Disclaimer({ className }: { className?: string }) {
  return <p className={cn("text-center text-xs text-muted", className)}>{DISCLAIMER}</p>;
}
