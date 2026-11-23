import { LogOutButton } from "@/components/auth/log-out-button";
import { AppShell } from "@/components/shell/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function OwnerLayout({ children }: LayoutProps<"/app">) {
  const user = await requireRole("business_owner");
  return (
    <AppShell
      role="business_owner"
      user={{ name: user.fullName, subtitle: user.businesses[0]?.name }}
      userAction={<LogOutButton />}
    >
      {children}
    </AppShell>
  );
}
