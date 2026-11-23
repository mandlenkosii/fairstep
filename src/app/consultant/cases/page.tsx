import type { Metadata } from "next";
import { parseTab, ReviewQueue } from "@/components/consultant/review-queue";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "All cases" };

export default async function ConsultantCasesPage({
  searchParams,
}: PageProps<"/consultant/cases">) {
  await requireRole("consultant");
  const { tab } = await searchParams;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="text-headline-lg">All cases</h1>
      <p className="mt-1 text-muted">Every case at the businesses assigned to you.</p>
      <ReviewQueue tab={parseTab(tab, "all")} basePath="/consultant/cases" />
    </div>
  );
}
