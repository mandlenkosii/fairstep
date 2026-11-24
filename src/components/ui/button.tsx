import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

const variants: Record<Variant, string> = {
  // Tactile: a soft top highlight, a crisp edge and a teal glow underneath.
  primary:
    "bg-gradient-to-b from-[#16706b] to-primary text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(10_71_68/0.4),0_8px_18px_-8px_rgb(14_94_90/0.65)] hover:from-primary hover:to-primary-hover",
  secondary:
    "border border-line bg-surface text-ink shadow-[inset_0_-1px_0_rgb(28_43_42/0.06),0_1px_2px_rgb(28_43_42/0.06)] hover:border-primary/30 hover:bg-paper",
  ghost: "text-primary hover:bg-primary-tint",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const sizes: Record<Size, string> = {
  md: "text-sm",
  lg: "min-h-12 px-5 text-base",
};

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  /** Disables the button and tells screen readers it is busy (e.g. while a form submits). */
  pending?: boolean;
};

export function Button({
  variant,
  size,
  pending = false,
  disabled,
  className,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {pending && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

/** A link that looks like a button, for navigation such as "Start your free trial". */
export function ButtonLink({ variant, size, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
