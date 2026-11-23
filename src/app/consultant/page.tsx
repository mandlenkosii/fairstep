import type { Metadata } from "next";
import { parseTab, ReviewQueue } from "@/components/consultant/review-queue";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Review queue" };

export default async function ConsultantQueuePage({ searchParams }: PageProps<"/consultant">) {
  const user = await requireRole("consultant");
  const { tab } = await searchParams;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="text-headline-lg">Review queue</h1>
      <p className="mt-1 text-muted">
        Welcome, {user.fullName.split(" ")[0]}. Cases your clients have sent you to check before
        they act.
      </p>
      <ReviewQueue tab={parseTab(tab, "pending_review")} basePath="/consultant" />
    </div>
  );
}
