/**
 * Row Level Security tests: proves the permission rules hold in the database
 * itself, whatever the UI does.
 *
 * Runs against a local Supabase in CI (`supabase start`). It can also run
 * against a hosted project with RLS_TESTS_ALLOW_REMOTE=1: then the append-only
 * tests are skipped, because case_events rows can never be deleted, and every
 * other test row is removed afterwards.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const isLocal = /\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url);
const allowed = isLocal || process.env.RLS_TESTS_ALLOW_REMOTE === "1";

if (!url || !anonKey || !serviceRoleKey) {
  throw new Error(
    "RLS tests need NEXT_PUBLIC_SUPABASE_URL, the anon key and the service role key.",
  );
}
if (!allowed) {
  throw new Error(
    "Refusing to run RLS tests against a hosted project without RLS_TESTS_ALLOW_REMOTE=1.",
  );
}

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const run = `${Date.now()}`;
const password = "Rls-test-pass-2026";

type Actor = { id: string; db: SupabaseClient };

const created = { users: [] as string[], businesses: [] as string[], files: [] as string[] };

/** Returns the data of a Supabase call, or fails the test setup with a readable message. */
function must<R extends { data: unknown; error: { message: string } | null }>(
  result: R,
  what: string,
): NonNullable<R["data"]> {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
  if (result.data == null) throw new Error(`${what}: no data returned`);
  return result.data as NonNullable<R["data"]>;
}

async function actor(
  name: string,
  role: "business_owner" | "consultant" | "admin",
): Promise<Actor> {
  const email = `rls-${name}-${run}@rls-test.invalid`;
  const { user } = must(
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `RLS ${name}` },
    }),
    `create ${name}`,
  );
  created.users.push(user!.id);
  if (role !== "business_owner") {
    must(await admin.from("profiles").update({ role }).eq("id", user!.id), `role for ${name}`);
  }
  const db = createClient(url, anonKey, { auth: { persistSession: false } });
  must(await db.auth.signInWithPassword({ email, password }), `log in ${name}`);
  return { id: user!.id, db };
}

async function business(name: string, owner: Actor): Promise<string> {
  const { id } = must(
    await admin.from("businesses").insert({ name }).select("id").single(),
    `business ${name}`,
  );
  created.businesses.push(id);
  must(
    await admin.from("business_members").insert({ business_id: id, user_id: owner.id }),
    `membership ${name}`,
  );
  return id;
}

let ownerA: Actor, ownerB: Actor, consultant: Actor, platformAdmin: Actor;
let bizA: string, bizB: string, employeeA: string, employeeB: string, caseA: string;

beforeAll(async () => {
  [ownerA, ownerB, consultant, platformAdmin] = await Promise.all([
    actor("owner-a", "business_owner"),
    actor("owner-b", "business_owner"),
    actor("consultant", "consultant"),
    actor("admin", "admin"),
  ]);
  bizA = await business(`RLS Business A ${run}`, ownerA);
  bizB = await business(`RLS Business B ${run}`, ownerB);
  must(
    await admin
      .from("consultant_assignments")
      .insert({ consultant_id: consultant.id, business_id: bizA }),
    "assign consultant",
  );

  employeeA = must(
    await admin
      .from("employees")
      .insert({ business_id: bizA, first_name: "Ann", last_name: "A", job_title: "Cashier" })
      .select("id")
      .single(),
    "employee A",
  ).id;
  employeeB = must(
    await admin
      .from("employees")
      .insert({ business_id: bizB, first_name: "Ben", last_name: "B", job_title: "Guard" })
      .select("id")
      .single(),
    "employee B",
  ).id;
  caseA = must(
    await admin
      .from("cases")
      .insert({ business_id: bizA, employee_id: employeeA, created_by: ownerA.id })
      .select("id")
      .single(),
    "case A",
  ).id;
});

afterAll(async () => {
  if (created.files.length) await admin.storage.from("evidence").remove(created.files);
  for (const id of created.businesses) {
    // Locally the database is thrown away; on a hosted project, cases without events can go.
    await admin.from("comments").delete().eq("business_id", id);
    await admin.from("cases").delete().eq("business_id", id);
    await admin.from("incidents").delete().eq("business_id", id);
    await admin.from("employees").delete().eq("business_id", id);
    await admin.from("consultant_assignments").delete().eq("business_id", id);
    await admin.from("business_members").delete().eq("business_id", id);
    await admin.from("businesses").delete().eq("id", id);
  }
  for (const id of created.users) await admin.auth.admin.deleteUser(id);
});

describe("not logged in", () => {
  it("can't read any table", async () => {
    const anon = createClient(url, anonKey, { auth: { persistSession: false } });
    for (const table of ["profiles", "businesses", "employees", "cases", "case_events"]) {
      const { data, error } = await anon.from(table).select("id");
      expect(error !== null || data?.length === 0, table).toBe(true);
    }
  });
});

describe("tenant isolation between owners", () => {
  it("an owner sees only their own business", async () => {
    const { data } = await ownerB.db.from("businesses").select("id");
    expect(data?.map((b) => b.id)).toEqual([bizB]);
  });

  it("an owner gets no rows from another business's employees and cases", async () => {
    const employees = await ownerB.db.from("employees").select("id").eq("business_id", bizA);
    const cases = await ownerB.db.from("cases").select("id").eq("id", caseA);
    expect(employees.data).toEqual([]);
    expect(cases.data).toEqual([]);
  });

  it("an owner can't write into another business", async () => {
    const { error } = await ownerA.db
      .from("employees")
      .insert({ business_id: bizB, first_name: "X", last_name: "Y", job_title: "Z" });
    expect(error).not.toBeNull();
  });

  it("an owner can't edit another business's employee", async () => {
    const { data } = await ownerA.db
      .from("employees")
      .update({ job_title: "Changed" })
      .eq("id", employeeB)
      .select();
    expect(data).toEqual([]);
  });

  it("an owner can add and edit their own employees", async () => {
    const added = await ownerA.db
      .from("employees")
      .insert({ business_id: bizA, first_name: "New", last_name: "Hire", job_title: "Waiter" })
      .select("id")
      .single();
    expect(added.error).toBeNull();
    const edited = await ownerA.db
      .from("employees")
      .update({ job_title: "Senior waiter" })
      .eq("id", added.data!.id)
      .select();
    expect(edited.data).toHaveLength(1);
  });
});

describe("consultants", () => {
  it("see assigned businesses only", async () => {
    const { data } = await consultant.db.from("businesses").select("id");
    expect(data?.map((b) => b.id)).toEqual([bizA]);
    const other = await consultant.db.from("employees").select("id").eq("business_id", bizB);
    expect(other.data).toEqual([]);
  });

  it("can read the assigned business's cases", async () => {
    const { data } = await consultant.db.from("cases").select("id").eq("id", caseA);
    expect(data).toHaveLength(1);
  });

  it("can't add employees or open cases", async () => {
    const employee = await consultant.db
      .from("employees")
      .insert({ business_id: bizA, first_name: "X", last_name: "Y", job_title: "Z" });
    const kase = await consultant.db
      .from("cases")
      .insert({ business_id: bizA, employee_id: employeeA, created_by: consultant.id });
    expect(employee.error).not.toBeNull();
    expect(kase.error).not.toBeNull();
  });

  it("can't change case facts", async () => {
    const { data, error } = await consultant.db
      .from("cases")
      .update({ chairperson_name: "Someone else" })
      .eq("id", caseA)
      .select();
    expect(error !== null || data?.length === 0).toBe(true);
  });
});

describe("review sign-off", () => {
  it("an owner can't approve their own case", async () => {
    const { error } = await ownerA.db
      .from("cases")
      .update({ review_status: "approved" })
      .eq("id", caseA);
    expect(error).not.toBeNull();
  });

  it("the owner sends for review and only the assigned consultant approves", async () => {
    const sent = await ownerA.db
      .from("cases")
      .update({ review_status: "pending_review" })
      .eq("id", caseA)
      .select();
    expect(sent.data).toHaveLength(1);

    const approved = await consultant.db
      .from("cases")
      .update({ review_status: "approved" })
      .eq("id", caseA)
      .select("review_status");
    expect(approved.data).toEqual([{ review_status: "approved" }]);
  });
});

describe("roles", () => {
  it("users can't promote themselves", async () => {
    const { error } = await ownerA.db
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", ownerA.id);
    expect(error).not.toBeNull();
  });

  it("admins see businesses but no employee or case data (POPIA)", async () => {
    const businesses = await platformAdmin.db
      .from("businesses")
      .select("id")
      .in("id", [bizA, bizB]);
    const employees = await platformAdmin.db.from("employees").select("id");
    const cases = await platformAdmin.db.from("cases").select("id");
    expect(businesses.data).toHaveLength(2);
    expect(employees.data).toEqual([]);
    expect(cases.data).toEqual([]);
  });
});

describe("no hard deletes", () => {
  it("an owner can't delete a case or an employee", async () => {
    await ownerA.db.from("cases").delete().eq("id", caseA);
    await ownerA.db.from("employees").delete().eq("id", employeeA);
    const kase = await admin.from("cases").select("id").eq("id", caseA);
    const employee = await admin.from("employees").select("id").eq("id", employeeA);
    expect(kase.data).toHaveLength(1);
    expect(employee.data).toHaveLength(1);
  });
});

describe.skipIf(!isLocal)("append-only audit trail (local database only)", () => {
  let eventId: string;

  beforeAll(async () => {
    eventId = must(
      await ownerA.db
        .from("case_events")
        .insert({
          case_id: caseA,
          business_id: bizA,
          actor_id: ownerA.id,
          event_type: "case.opened",
        })
        .select("id")
        .single(),
      "insert event",
    ).id;
  });

  it("the other owner can't read the timeline", async () => {
    const { data } = await ownerB.db.from("case_events").select("id").eq("case_id", caseA);
    expect(data).toEqual([]);
  });

  it("nobody can edit or delete an event, not even the service role", async () => {
    const ownerEdit = await ownerA.db
      .from("case_events")
      .update({ event_type: "tampered" })
      .eq("id", eventId)
      .select();
    expect(ownerEdit.error !== null || ownerEdit.data?.length === 0).toBe(true);

    const serviceEdit = await admin
      .from("case_events")
      .update({ event_type: "tampered" })
      .eq("id", eventId);
    const serviceDelete = await admin.from("case_events").delete().eq("id", eventId);
    expect(serviceEdit.error).not.toBeNull();
    expect(serviceDelete.error).not.toBeNull();

    const { data } = await admin.from("case_events").select("event_type").eq("id", eventId);
    expect(data).toEqual([{ event_type: "case.opened" }]);
  });

  it("an event can't be written in someone else's name", async () => {
    const { error } = await ownerA.db.from("case_events").insert({
      case_id: caseA,
      business_id: bizA,
      actor_id: consultant.id,
      event_type: "review.approved",
    });
    expect(error).not.toBeNull();
  });
});

describe("private file storage", () => {
  const pdf = () => new Blob(["%PDF-1.4 rls test"], { type: "application/pdf" });

  it("only the business's owner can upload, into its own folder", async () => {
    const path = `${bizA}/rls/${run}.pdf`;
    const own = await ownerA.db.storage.from("evidence").upload(path, pdf());
    expect(own.error).toBeNull();
    created.files.push(path);

    const other = await ownerA.db.storage.from("evidence").upload(`${bizB}/rls/${run}.pdf`, pdf());
    const byConsultant = await consultant.db.storage
      .from("evidence")
      .upload(`${bizA}/rls/${run}-c.pdf`, pdf());
    expect(other.error).not.toBeNull();
    expect(byConsultant.error).not.toBeNull();
  });

  it("the assigned consultant can read it; another owner can't", async () => {
    const path = `${bizA}/rls/${run}.pdf`;
    expect((await consultant.db.storage.from("evidence").download(path)).error).toBeNull();
    expect((await ownerB.db.storage.from("evidence").download(path)).error).not.toBeNull();
  });
});
