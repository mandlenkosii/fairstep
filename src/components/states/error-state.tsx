"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Shown when a page fails to load. In production Next.js hides the real error
 * from the browser, so the wording is general; the details are in the server logs.
 */
export function ErrorState({
  error,
  retry,
  homeHref,
}: {
  error: unknown;
  retry: () => void;
  homeHref: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-warning-tint text-warning-strong">
        <AlertTriangle aria-hidden className="size-7" />
      </span>
      <h1 className="mt-4 text-headline-md">Something went wrong</h1>
      <p className="mt-2 text-muted">
        We couldn’t load this page. Your records are safe. Try again, or go back and continue from
        there.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => retry()}>
          <RotateCcw aria-hidden className="size-4" />
          Try again
        </Button>
        <ButtonLink href={homeHref} variant="secondary">
          Go to your home page
        </ButtonLink>
      </div>
    </div>
  );
}
