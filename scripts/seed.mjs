/**
 * Seeds a Supabase project with fictional demo data and the three test logins.
 *
 *   npm run db:seed
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.
 * Uses the admin API so log-ins get properly hashed passwords. Runs once: case
 * history is append-only, so if the demo owner already exists it stops.
 *
 * All people and businesses are fictional. No ID numbers or home addresses (POPIA).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_PASSWORD ?? "FairStep-demo-2026";
if (!url || !serviceRoleKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.");
  process.exit(1);
}

const db = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

/** Throws with a readable message if a Supabase call failed. */
function must({ data, error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
}

// ---------------------------------------------------------------------------
// People who log in
// ---------------------------------------------------------------------------

const ACCOUNTS = {
  thabo: { email: "thabo@kasikitchen.test", name: "Thabo Mokoena", role: "business_owner" },
  naledi: { email: "naledi@dlaminilabour.test", name: "Naledi Dlamini", role: "consultant" },
  admin: { email: "admin@fairstep.test", name: "Ayesha Patel", role: "admin" },
  sibusiso: {
    email: "sibusiso@ubuntuguard.test",
    name: "Sibusiso Khumalo",
    role: "business_owner",
  },
  nomvula: {
    email: "nomvula@ezulwinispaza.test",
    name: "Nomvula Mahlangu",
    role: "business_owner",
  },
  kgosi: { email: "kgosi@bakwenabuild.test", name: "Kgosi Molefe", role: "business_owner" },
};

async function findUserByEmail(email) {
  const { data } = await db.auth.admin.listUsers({ perPage: 1000 });
  return data?.users.find((user) => user.email === email) ?? null;
}

async function createAccount({ email, name, role }) {
  const user = must(
    await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    }),
    `create ${email}`,
  ).user;
  // The sign-up trigger always makes a business_owner; promote here (service role only).
  if (role !== "business_owner") {
    must(await db.from("profiles").update({ role }).eq("id", user.id), `set role for ${email}`);
  }
  return user.id;
}

// ---------------------------------------------------------------------------
// Businesses and their people
// ---------------------------------------------------------------------------

const BUSINESSES = [
  {
    key: "kasi",
    name: "Kasi Kitchen",
    sector: "Restaurant",
    province: "Gauteng",
    plan: "starter",
    owner: "thabo",
    consultant: true,
    employees: [
      ["Sipho", "Ndlovu", "KK-001", "Head chef", "2019-03-01"],
      ["Lerato", "Khumalo", "KK-002", "Floor manager", "2020-07-15"],
      ["Ayanda", "Zulu", "KK-003", "Waitress", "2022-02-01"],
      ["Bongani", "Mthembu", "KK-004", "Cashier", "2023-05-08"],
      ["Zanele", "Nkosi", "KK-005", "Kitchen assistant", "2023-09-18"],
      ["Musa", "Dube", "KK-006", "Waiter", "2024-01-10"],
      ["Pieter", "van Wyk", "KK-007", "Delivery driver", "2024-06-03"],
      ["Thandiwe", "Sithole", "KK-008", "Cleaner", "2021-11-22"],
    ],
  },
  {
    key: "ubuntu",
    name: "Ubuntu Guard Security",
    sector: "Security services",
    province: "KwaZulu-Natal",
    plan: "growth",
    owner: "sibusiso",
    consultant: true,
    employees: [
      ["Mandla", "Ngcobo", "UG-101", "Site supervisor", "2018-04-01"],
      ["Sizwe", "Cele", "UG-102", "Security officer", "2021-08-16"],
      ["Nokuthula", "Mkhize", "UG-103", "Security officer", "2022-03-07"],
      ["Thulani", "Gumede", "UG-104", "Control room operator", "2023-01-09"],
      ["Rajesh", "Naidoo", "UG-105", "Security officer", "2024-02-19"],
    ],
  },
  {
    key: "ezulwini",
    name: "Ezulwini Spaza & Groceries",
    sector: "Retail",
    province: "Mpumalanga",
    plan: "starter",
    owner: "nomvula",
    consultant: false,
    employees: [
      ["Precious", "Shabangu", null, "Shop assistant", "2022-05-02"],
      ["Jabulani", "Nkosi", null, "Stock controller", "2021-01-11"],
      ["Lindiwe", "Masilela", null, "Cashier", "2023-10-02"],
      ["Themba", "Mabuza", null, "Driver", "2024-04-15"],
    ],
  },
  {
    key: "bakwena",
    name: "Bakwena Build Contractors",
    sector: "Construction",
    province: "North West",
    plan: "growth",
    owner: "kgosi",
    consultant: false,
    employees: [
      ["Tebogo", "Mokgosi", "BB-01", "Site foreman", "2017-09-04"],
      ["Kagiso", "Seleke", "BB-02", "Bricklayer", "2020-02-17"],
      ["Johannes", "Botha", "BB-03", "Plumber", "2021-06-21"],
      ["Mpho", "Ramaphakela", "BB-04", "General worker", "2023-03-13"],
      ["Neo", "Tau", "BB-05", "General worker", "2024-08-05"],
    ],
  },
];

// ---------------------------------------------------------------------------
// Incidents and cases (timestamps in UTC; SAST is UTC+2)
// ---------------------------------------------------------------------------

const RIGHTS = { representation: true, interpreter: true, witnesses: true };

const INCIDENTS = [
  {
    business: "kasi",
    employee: "Bongani Mthembu",
    occurred_at: "2026-11-09T19:30:00Z",
    location: "Front counter, Kasi Kitchen, Soweto",
    category: "negligence",
    description:
      "At cash-up on Monday evening the till was R1,200 short. CCTV shows the cash drawer open and unattended for about 10 minutes while the cashier was away from the counter.",
    witnesses: ["Lerato Khumalo", "Ayanda Zulu"],
    case: {
      current_step: "notice",
      review_status: "pending_review",
      complainant_name: "Lerato Khumalo",
      chairperson_name: "Naledi Dlamini",
      hearing_at: "2026-11-26T08:00:00Z",
      step_data: {
        investigation: {
          investigator: "Thabo Mokoena",
          findings:
            "CCTV confirms the drawer was left open from 19:12 to 19:22. Bongani says he went to help a customer at the takeaway window. No evidence that he took the money.",
        },
        notice: {
          allegations: [
            "Negligence: leaving the cash drawer open and unattended on 9 Nov 2026, resulting in a R1,200 shortage.",
          ],
          deliveredAt: "2026-11-23T08:00:00Z",
          hearingAt: "2026-11-26T08:00:00Z",
          venue: "Back office, Kasi Kitchen",
          rights: RIGHTS,
        },
      },
      events: [
        ["case.opened", "thabo", "2026-11-10T07:00:00Z", {}],
        [
          "step.advanced",
          "thabo",
          "2026-11-10T07:05:00Z",
          { from: "incident", to: "investigation" },
        ],
        ["step.advanced", "thabo", "2026-11-20T09:00:00Z", { from: "investigation", to: "notice" }],
        ["review.requested", "thabo", "2026-11-23T08:30:00Z", {}],
      ],
      comments: [],
    },
  },
  {
    business: "kasi",
    employee: "Musa Dube",
    occurred_at: "2026-10-24T06:45:00Z",
    location: "Kasi Kitchen, Soweto",
    category: "late_coming",
    description:
      "Arrived 75 minutes late for the Saturday morning shift without phoning ahead. Third late arrival in October (also 3 Oct and 17 Oct), all recorded in the shift register.",
    witnesses: ["Lerato Khumalo"],
    case: {
      current_step: "closed",
      review_status: "approved",
      complainant_name: "Lerato Khumalo",
      chairperson_name: "Naledi Dlamini",
      hearing_at: "2026-10-30T08:00:00Z",
      outcome: "written",
      closed_at: "2026-11-06T10:00:00Z",
      step_data: {
        investigation: {
          investigator: "Thabo Mokoena",
          findings:
            "Shift register shows late arrivals on 3, 17 and 24 October. No reasons given at the time.",
        },
        notice: {
          allegations: ["Late coming on 3, 17 and 24 October 2026 without notifying the manager."],
          deliveredAt: "2026-10-27T08:00:00Z",
          hearingAt: "2026-10-30T08:00:00Z",
          venue: "Back office, Kasi Kitchen",
          rights: RIGHTS,
        },
        hearing: {
          employeeAttended: true,
          employeeResponse:
            "Taxi strikes on the Orlando route caused two of the late arrivals. Accepts he should have phoned.",
          postponements: 0,
        },
        outcome: {
          sanction: "written",
          reasons:
            "Repeated late coming affects the breakfast shift. Taxi strikes partly explain it, so a written warning rather than a final warning.",
          deliveredAt: "2026-10-30T12:00:00Z",
          priorWarnings: [],
        },
      },
      events: [
        ["case.opened", "thabo", "2026-10-26T07:00:00Z", {}],
        [
          "step.advanced",
          "thabo",
          "2026-10-26T07:10:00Z",
          { from: "incident", to: "investigation" },
        ],
        ["step.advanced", "thabo", "2026-10-27T07:30:00Z", { from: "investigation", to: "notice" }],
        ["step.advanced", "thabo", "2026-10-30T08:00:00Z", { from: "notice", to: "hearing" }],
        ["step.advanced", "thabo", "2026-10-30T11:30:00Z", { from: "hearing", to: "outcome" }],
        ["review.requested", "thabo", "2026-10-30T11:45:00Z", {}],
        ["review.approved", "naledi", "2026-11-02T09:15:00Z", {}],
        ["step.advanced", "thabo", "2026-11-06T10:00:00Z", { from: "outcome", to: "closed" }],
      ],
      comments: [
        [
          "naledi",
          "2026-11-02T09:14:00Z",
          "Process is sound: notice gave 3 working days and his explanation is recorded. A written warning is proportionate. Approved.",
        ],
      ],
    },
  },
  {
    business: "kasi",
    employee: "Zanele Nkosi",
    occurred_at: "2026-11-17T05:00:00Z",
    location: "Kasi Kitchen, Soweto",
    category: "absenteeism",
    description:
      "Did not come to work on Tuesday 17 and Wednesday 18 November and did not phone in. Colleagues could not reach her.",
    witnesses: ["Sipho Ndlovu"],
    case: {
      current_step: "investigation",
      review_status: "not_requested",
      complainant_name: "Sipho Ndlovu",
      step_data: {},
      events: [
        ["case.opened", "thabo", "2026-11-19T06:30:00Z", {}],
        [
          "step.advanced",
          "thabo",
          "2026-11-19T06:35:00Z",
          { from: "incident", to: "investigation" },
        ],
      ],
      comments: [],
    },
  },
  {
    business: "kasi",
    employee: "Pieter van Wyk",
    occurred_at: "2026-11-18T11:20:00Z",
    location: "Vilakazi Street, Orlando West (delivery route)",
    category: "damage_to_property",
    description:
      "The delivery scooter's side mirror and front fairing were damaged. Pieter reported that he hit a pothole while avoiding a taxi. Repair quote: R2,350.",
    witnesses: [],
  },
  {
    business: "ubuntu",
    employee: "Sizwe Cele",
    occurred_at: "2026-11-14T01:40:00Z",
    location: "Guard house, Gate 2, Umhlanga client site",
    category: "safety",
    description:
      "Found asleep in the guard house during a night shift by the site supervisor at 03:40. The boom gate was left open.",
    witnesses: ["Mandla Ngcobo"],
    case: {
      current_step: "notice",
      review_status: "changes_requested",
      complainant_name: "Mandla Ngcobo",
      chairperson_name: "Mandla Ngcobo",
      step_data: {
        investigation: {
          investigator: "Sibusiso Khumalo",
          findings:
            "Supervisor's report and photo of the open gate. Sizwe had worked a double shift the day before.",
        },
        notice: {
          allegations: ["Sleeping on duty at the Umhlanga client site on 14 Nov 2026."],
          venue: "Ubuntu Guard office, Durban North",
          rights: RIGHTS,
        },
      },
      events: [
        ["case.opened", "sibusiso", "2026-11-16T07:00:00Z", {}],
        [
          "step.advanced",
          "sibusiso",
          "2026-11-16T07:05:00Z",
          { from: "incident", to: "investigation" },
        ],
        [
          "step.advanced",
          "sibusiso",
          "2026-11-18T10:00:00Z",
          { from: "investigation", to: "notice" },
        ],
        ["review.requested", "sibusiso", "2026-11-18T10:30:00Z", {}],
        ["review.changes_requested", "naledi", "2026-11-19T08:00:00Z", {}],
      ],
      comments: [
        [
          "naledi",
          "2026-11-19T07:58:00Z",
          "Mandla found him asleep, so he is the complainant and a witness. He can't chair the hearing. Please choose another chairperson, and set a hearing date at least 2 working days after the notice is delivered.",
        ],
      ],
    },
  },
  {
    business: "ezulwini",
    employee: "Themba Mabuza",
    occurred_at: "2026-11-12T13:00:00Z",
    location: "Stock room, Ezulwini Spaza & Groceries, KaNyamazane",
    category: "theft",
    description:
      "Two cases of cooking oil missing from the stock count. Stock was last counted on 5 Nov. Investigation needed before anyone is accused.",
    witnesses: ["Jabulani Nkosi"],
  },
  {
    business: "bakwena",
    employee: "Neo Tau",
    occurred_at: "2026-11-11T07:15:00Z",
    location: "Phase 2 site, Rustenburg",
    category: "safety",
    description:
      "Working on scaffolding at 4 m without a safety harness after a toolbox talk on fall protection that morning.",
    witnesses: ["Tebogo Mokgosi", "Kagiso Seleke"],
    case: {
      current_step: "investigation",
      review_status: "not_requested",
      complainant_name: "Tebogo Mokgosi",
      step_data: {},
      events: [
        ["case.opened", "kgosi", "2026-11-12T06:00:00Z", {}],
        [
          "step.advanced",
          "kgosi",
          "2026-11-12T06:05:00Z",
          { from: "incident", to: "investigation" },
        ],
      ],
      comments: [],
    },
  },
];

// ---------------------------------------------------------------------------

async function main() {
  if (await findUserByEmail(ACCOUNTS.thabo.email)) {
    console.log("Demo data is already there (found Thabo's account). Nothing to do.");
    return;
  }

  console.log("Creating accounts…");
  const userIds = {};
  for (const [key, account] of Object.entries(ACCOUNTS)) {
    userIds[key] = await createAccount(account);
  }

  console.log("Creating businesses and employees…");
  const businessIds = {};
  const employeeIds = {};
  for (const business of BUSINESSES) {
    const { id } = must(
      await db
        .from("businesses")
        .insert({
          name: business.name,
          sector: business.sector,
          province: business.province,
          plan: business.plan,
        })
        .select("id")
        .single(),
      `create ${business.name}`,
    );
    businessIds[business.key] = id;

    must(
      await db
        .from("business_members")
        .insert({ business_id: id, user_id: userIds[business.owner], member_role: "owner" }),
      `owner of ${business.name}`,
    );
    if (business.consultant) {
      must(
        await db.from("consultant_assignments").insert({
          consultant_id: userIds.naledi,
          business_id: id,
          assigned_by: userIds.admin,
        }),
        `assign Naledi to ${business.name}`,
      );
    }

    const rows = business.employees.map(([first, last, number, title, start]) => ({
      business_id: id,
      first_name: first,
      last_name: last,
      employee_number: number,
      job_title: title,
      start_date: start,
    }));
    const inserted = must(
      await db.from("employees").insert(rows).select("id, first_name, last_name"),
      `employees of ${business.name}`,
    );
    for (const employee of inserted) {
      employeeIds[`${employee.first_name} ${employee.last_name}`] = employee.id;
    }
  }

  // Archived employee, to show the archive state.
  must(
    await db.from("employees").insert({
      business_id: businessIds.kasi,
      first_name: "Kabelo",
      last_name: "Moloi",
      employee_number: "KK-000",
      job_title: "Barista",
      start_date: "2020-01-06",
      status: "archived",
    }),
    "archived employee",
  );

  console.log("Creating incidents, cases and timelines…");
  for (const incident of INCIDENTS) {
    const businessId = businessIds[incident.business];
    const owner = BUSINESSES.find((b) => b.key === incident.business).owner;
    const { id: incidentId } = must(
      await db
        .from("incidents")
        .insert({
          business_id: businessId,
          employee_id: employeeIds[incident.employee],
          occurred_at: incident.occurred_at,
          location: incident.location,
          category: incident.category,
          description: incident.description,
          witnesses: incident.witnesses,
          reported_by: userIds[owner],
          created_at: incident.occurred_at,
        })
        .select("id")
        .single(),
      `incident for ${incident.employee}`,
    );

    if (!incident.case) continue;
    const { events, comments, ...caseFields } = incident.case;
    const kase = must(
      await db
        .from("cases")
        .insert({
          ...caseFields,
          business_id: businessId,
          employee_id: employeeIds[incident.employee],
          incident_id: incidentId,
          created_by: userIds[owner],
          created_at: events[0][2],
        })
        .select("id, reference")
        .single(),
      `case for ${incident.employee}`,
    );
    must(
      await db.from("case_events").insert(
        events.map(([event_type, actor, created_at, payload]) => ({
          case_id: kase.id,
          business_id: businessId,
          actor_id: userIds[actor],
          event_type,
          payload,
          created_at,
        })),
      ),
      `timeline for ${kase.reference}`,
    );
    if (comments.length) {
      must(
        await db.from("comments").insert(
          comments.map(([author, created_at, body]) => ({
            case_id: kase.id,
            business_id: businessId,
            author_id: userIds[author],
            body,
            created_at,
          })),
        ),
        `comments for ${kase.reference}`,
      );
    }
    console.log(`  ${kase.reference}  ${incident.employee} (${caseFields.current_step})`);
  }

  console.log(`
Done. Test logins (password: ${password}):
  Owner       ${ACCOUNTS.thabo.email}
  Consultant  ${ACCOUNTS.naledi.email}
  Admin       ${ACCOUNTS.admin.email}`);
}

main().catch((error) => {
  console.error(`Seed failed: ${error.message}`);
  process.exit(1);
});
