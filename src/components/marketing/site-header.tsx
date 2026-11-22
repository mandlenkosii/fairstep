import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#consultants", label: "For consultants" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" aria-label="FairStep home">
          <Logo />
        </Link>
        <nav aria-label="Site" className="hidden items-center gap-8 text-sm font-medium md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-muted hover:text-ink">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden min-h-11 items-center px-3 text-sm font-semibold text-primary sm:flex"
          >
            Log in
          </Link>
          <ButtonLink href="/signup">Start free trial</ButtonLink>
        </div>
      </div>
    </header>
  );
}
