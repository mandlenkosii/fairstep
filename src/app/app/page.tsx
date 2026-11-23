import type { Metadata } from "next";
import { Card, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Dashboard" };

export default async function OwnerDashboardPage() {
  // Checked again here: layouts don't re-run on every navigation.
  const user = await requireRole("business_owner");
  const firstName = user.fullName.split(" ")[0];
  const business = user.businesses[0]?.name;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="text-headline-lg">Welcome, {firstName}</h1>
      {business && <p className="mt-1 text-muted">{business}</p>}
      <Card className="mt-8">
        <CardTitle>Your account is ready</CardTitle>
        <p className="mt-2 text-muted">
          Start by adding your employees. Then, when something happens at work, log it as an
          incident on the same day, with any photos or documents.
        </p>
      </Card>
    </div>
  );
}
