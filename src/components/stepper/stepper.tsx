import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

export type StepStatus = "completed" | "current" | "blocked" | "upcoming";

export type StepperStep = {
  key: string;
  label: string;
  status: StepStatus;
  /** A date or short note under the label, e.g. "Thu 26 Nov, 10:00". */
  detail?: string;
  /** Plain-language reason a blocked step can't start yet. */
  reason?: string;
  optional?: boolean;
};

type StepperProps = {
  steps: StepperStep[];
  /** Small horizontal bar for lists and dashboards: no details or reasons. */
  compact?: boolean;
  /** Keep the vertical list at every screen size, e.g. inside a narrow card. */
  vertical?: boolean;
  className?: string;
};

// Read out by screen readers, because colour and icons alone don't explain the state.
const statusText: Record<StepStatus, string> = {
  completed: "Completed",
  current: "Current step",
  blocked: "Blocked",
  upcoming: "Not started",
};

/**
 * The "Fair Steps" progress stepper, FairStep's signature component.
 * Full mode: a vertical list on mobile and a horizontal row from the md breakpoint.
 * Vertical mode: always the vertical list.
 * Compact mode: always a small horizontal row.
 */
export function Stepper({ steps, compact = false, vertical = false, className }: StepperProps) {
  const layout: Layout = compact ? "compact" : vertical ? "vertical" : "responsive";

  return (
    <ol
      aria-label="Case progress"
      className={cn(
        "flex",
        layout === "compact" && "flex-row",
        layout === "vertical" && "flex-col",
        layout === "responsive" && "flex-col md:flex-row",
        className,
      )}
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <li
            key={step.key}
            aria-current={step.status === "current" ? "step" : undefined}
            className={cn(
              "relative flex flex-1",
              layout === "compact" && "flex-col items-center text-center",
              layout !== "compact" && "gap-3 pb-6 last:pb-0",
              layout === "responsive" &&
                "md:flex-col md:items-center md:gap-2 md:pb-0 md:text-center",
            )}
          >
            {!isLast && <Connector done={step.status === "completed"} layout={layout} />}
            <StepCircle status={step.status} number={index + 1} compact={compact} />

            <div
              className={cn(
                "min-w-0",
                layout === "compact" && "mt-1",
                layout === "vertical" && "pt-1",
                layout === "responsive" && "pt-1 md:pt-0",
              )}
            >
              <p
                className={cn(
                  compact ? "hidden text-xs sm:block" : "text-sm",
                  step.status === "current" ? "font-semibold text-ink" : "font-medium",
                  step.status === "upcoming" || step.status === "blocked"
                    ? "text-muted"
                    : "text-ink",
                )}
              >
                {step.label}
                {step.optional && !compact && (
                  <span className="font-normal text-muted"> (optional)</span>
                )}
              </p>
              <span className="sr-only">{statusText[step.status]}</span>

              {!compact && step.detail && <p className="text-xs text-muted">{step.detail}</p>}
              {!compact && step.status === "blocked" && step.reason && (
                <p
                  className={cn(
                    "mt-1 max-w-56 rounded-lg bg-warning-tint px-2 py-1 text-xs text-warning-strong",
                    layout === "responsive" && "md:mx-auto",
                  )}
                >
                  {step.reason}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StepCircle({
  status,
  number,
  compact,
}: {
  status: StepStatus;
  number: number;
  compact: boolean;
}) {
  const size = compact ? "size-6 text-xs" : "size-8 text-sm";
  const icon = compact ? "size-3.5" : "size-4";

  return (
    <span
      aria-hidden
      className={cn(
        "relative z-10 flex shrink-0 items-center justify-center rounded-full font-semibold",
        size,
        status === "completed" && "bg-primary text-white",
        status === "current" && "animate-pulse-ring bg-surface text-ink ring-[3px] ring-accent",
        status === "blocked" && "bg-line text-muted",
        status === "upcoming" && "border-2 border-line bg-surface text-muted",
      )}
    >
      {status === "completed" && <Check className={icon} strokeWidth={3} />}
      {status === "blocked" && <Lock className={icon} />}
      {(status === "current" || status === "upcoming") && number}
    </span>
  );
}

/** The line joining a step to the next one: teal once the step is done. */
function Connector({ done, layout }: { done: boolean; layout: Layout }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute transition-colors duration-500",
        done ? "bg-primary" : "bg-line",
        layout === "compact" && "top-3 right-[calc(-50%+14px)] left-[calc(50%+14px)] h-0.5",
        layout !== "compact" && "top-9 bottom-1 left-[15px] w-0.5",
        layout === "responsive" &&
          "md:top-4 md:right-[calc(-50%+20px)] md:bottom-auto md:left-[calc(50%+20px)] md:h-0.5 md:w-auto",
      )}
    />
  );
}

type Layout = "responsive" | "vertical" | "compact";
