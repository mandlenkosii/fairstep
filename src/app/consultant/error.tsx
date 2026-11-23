"use client";

import { ErrorState } from "@/components/states/error-state";

export default function AreaError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorState error={error} retry={retry} homeHref="/consultant" />;
}
