import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { Disclaimer } from "@/components/shell/disclaimer";

export const metadata: Metadata = { title: "Page not found" };

/** Also shown for records you don't have access to, so nothing is revealed about them. */
export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <Logo />
        <p className="mt-10 label-caps text-muted">404</p>
        <h1 className="mt-2 text-headline-lg">We can’t find that page</h1>
        <p className="mt-2 text-muted">
          It may have moved, or it belongs to an account you don’t have access to.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/login">Go to your account</ButtonLink>
          <ButtonLink href="/" variant="secondary">
            FairStep home
          </ButtonLink>
        </div>
      </main>
      <footer className="px-4 py-6">
        <Disclaimer />
      </footer>
    </div>
  );
}
