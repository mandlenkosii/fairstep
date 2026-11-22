type LogoMarkProps = {
  /** Accessible name. Leave empty when visible text already names the logo. */
  title?: string;
  className?: string;
};

/** Three ascending teal steps with an ochre dot on the top step: a fair path, one step at a time. */
export function LogoMark({ title, className = "size-8" }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect x="3" y="21" width="7" height="8" rx="1.5" fill="var(--color-primary)" opacity="0.55" />
      <rect
        x="12.5"
        y="15"
        width="7"
        height="14"
        rx="1.5"
        fill="var(--color-primary)"
        opacity="0.8"
      />
      <rect x="22" y="9" width="7" height="20" rx="1.5" fill="var(--color-primary)" />
      <circle cx="25.5" cy="4.5" r="2.75" fill="var(--color-accent)" />
    </svg>
  );
}

type LogoProps = {
  showWordmark?: boolean;
  className?: string;
};

export function Logo({ showWordmark = true, className = "" }: LogoProps) {
  if (!showWordmark) return <LogoMark title="FairStep" className={className || "size-8"} />;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="font-serif text-headline-md font-semibold text-ink">FairStep</span>
    </span>
  );
}
