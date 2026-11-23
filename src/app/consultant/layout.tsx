import { LogOutButton } from "@/components/auth/log-out-button";
import { AppShell } from "@/components/shell/app-shell";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";

export default async function ConsultantLayout({ children }: LayoutProps<"/consultant">) {
  const user = await requireRole("consultant");
  return (
    <AppShell
      role="consultant"
      user={{ name: user.fullName, subtitle: ROLE_LABEL.consultant }}
      userAction={<LogOutButton />}
    >
      {children}
    </AppShell>
  );
}
