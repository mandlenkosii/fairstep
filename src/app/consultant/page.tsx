import type { Metadata } from "next";
import { Card, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Review queue" };

export default async function ConsultantHomePage() {
  const user = await requireRole("consultant");
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="text-headline-lg">Welcome, {user.fullName.split(" ")[0]}</h1>
      <Card className="mt-8">
        <CardTitle>Review queue</CardTitle>
        <p className="mt-2 text-muted">Cases your clients send for review will appear here.</p>
      </Card>
    </div>
  );
}
