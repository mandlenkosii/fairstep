import type { Metadata } from "next";
import { setUserRole } from "@/app/admin/actions";
import { AdminNotice } from "@/components/admin/admin-notice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { ROLE_LABEL, type Role } from "@/lib/auth/roles";
import { requireRole } from "@/lib/auth/session";
import { formatDate, initials } from "@/lib/format";
import { createAdminClient } from "@/lib/supabase/admin";
import { one } from "@/lib/supabase/one";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Users" };

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const me = await requireRole("admin");
  const { done, error } = await searchParams;
  const supabase = await createClient();
  const [{ data: profiles }, { data: members }, { data: auth }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, created_at").order("full_name"),
    supabase.from("business_members").select("user_id, business:businesses (name)"),
    // Log-in emails live in Supabase Auth; only the secret-key client can list them,
    // and only after the admin check above.
    createAdminClient().auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const emailFor = new Map((auth?.users ?? []).map((u) => [u.id, u.email ?? ""]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <h1 className="text-headline-lg">Users</h1>
      <p className="mt-1 text-muted">Everyone who can log in to FairStep, and their role.</p>
      <AdminNotice done={done} error={error} />
      <ul className="mt-6 flex flex-col gap-3">
        {(profiles ?? []).map((p) => {
          const business = (members ?? [])
            .filter((m) => m.user_id === p.id)
            .map((m) => one(m.business)?.name)
            .filter(Boolean)
            .join(", ");
          return (
            <li key={p.id}>
              <Card className="flex flex-wrap items-center gap-4">
                <span
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-tint font-semibold text-primary"
                >
                  {initials(p.full_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {p.full_name} {p.id === me.id && <Badge>You</Badge>}
                  </p>
                  <p className="truncate text-sm text-muted">{emailFor.get(p.id)}</p>
                  <p className="text-xs text-muted">
                    {business ? `${business} · ` : ""}Joined {formatDate(p.created_at)}
                  </p>
                </div>
                {p.id === me.id ? (
                  <Badge tone="primary">{ROLE_LABEL[p.role as Role]}</Badge>
                ) : (
                  <form action={setUserRole.bind(null, p.id)} className="flex gap-2">
                    <Select
                      name="role"
                      defaultValue={p.role}
                      aria-label={`Role for ${p.full_name}`}
                    >
                      {Object.entries(ROLE_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit" variant="secondary">
                      Save
                    </Button>
                  </form>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
