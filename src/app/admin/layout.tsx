import { LogOutButton } from "@/components/auth/log-out-button";
import { AppShell } from "@/components/shell/app-shell";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole("admin");
  return (
    <AppShell
      role="admin"
      user={{ name: user.fullName, subtitle: ROLE_LABEL.admin }}
      userAction={<LogOutButton />}
    >
      {children}
    </AppShell>
  );
}
