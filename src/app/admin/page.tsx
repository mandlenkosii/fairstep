import type { Metadata } from "next";
import { Card, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminHomePage() {
  const user = await requireRole("admin");
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="text-headline-lg">Welcome, {user.fullName.split(" ")[0]}</h1>
      <Card className="mt-8">
        <CardTitle>Platform overview</CardTitle>
        <p className="mt-2 text-muted">
          Businesses, users and consultant assignments are managed from here.
        </p>
      </Card>
    </div>
  );
}
