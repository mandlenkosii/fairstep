import { cloneElement, useId, type ComponentProps, type ReactElement } from "react";
import { cn } from "@/lib/cn";

const control =
  "block w-full min-h-11 rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-muted/70 focus:border-primary focus:outline-2 focus:outline-primary/30 aria-invalid:border-danger";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea rows={4} className={cn(control, "min-h-28", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(control, "pr-8", className)} {...props} />;
}

type ControlProps = {
  id?: string;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

type FieldProps = {
  label: string;
  hint?: string;
  /** Validation message from the server; shown under the input and read by screen readers. */
  error?: string;
  required?: boolean;
  className?: string;
  /** One Input, Textarea or Select. Field wires up its id and aria attributes. */
  children: ReactElement<ControlProps>;
};

export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {required && (
          <span className="text-danger" aria-hidden>
            {" "}
            *
          </span>
        )}
      </label>
      {cloneElement(children, {
        id,
        required,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
