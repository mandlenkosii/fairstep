import { expect, test, type Browser, type Page } from "@playwright/test";

/**
 * PRD §9 main flow, end to end in a real browser:
 * owner logs in → logs an incident and starts a case → records the
 * investigation → issues a notice (PDF) → records the hearing and outcome →
 * sends for review → consultant approves → owner exports the CCMA bundle.
 *
 * Uses the seeded demo logins (npm run db:seed) on a LOCAL Supabase only.
 */

const PASSWORD = "FairStep-demo-2026";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

test.skip(
  !/\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(supabaseUrl),
  "E2E tests create permanent case history, so they only run against a local Supabase.",
);

/** A SAST date-time for a datetime-local input, `days` from now. */
function sastInput(days: number) {
  const ms = Date.now() + days * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 16);
}

async function logIn(browser: Browser, email: string, home: string): Promise<Page> {
  const page = await (await browser.newContext({ acceptDownloads: true })).newPage();
  await page.goto("/login");
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(home);
  return page;
}

test("owner runs a fair case, consultant approves, owner exports the bundle", async ({
  browser,
}) => {
  const owner = await logIn(browser, "thabo@kasikitchen.test", "/app");

  // 1. Log an incident and start a case from it.
  await owner.goto("/app/incidents/new");
  await owner.getByLabel(/Employee/).selectOption({ label: "Sipho Ndlovu · Head chef" });
  await owner.getByLabel(/Location/).fill("Kitchen, Kasi Kitchen");
  await owner.getByText("Dishonesty", { exact: true }).click();
  await owner
    .getByLabel(/What happened/)
    .fill("Stock count shows 3 kg of lamb missing after the Friday night shift.");
  await owner.getByLabel(/Witnesses/).fill("Ayanda Zulu (Waitress)");
  await owner.getByLabel(/Start a disciplinary case/).check();
  await owner.getByRole("button", { name: "Save incident" }).click();
  await expect(owner).toHaveURL(/\/app\/cases\/[0-9a-f-]{36}\?opened=1/);
  const caseUrl = owner.url().split("?")[0];
  const caseId = caseUrl.split("/").pop()!;
  await expect(owner.getByText("Now: Investigation")).toBeVisible();

  // 2. The rules block the notice until findings are recorded.
  await expect(
    owner
      .getByText("Record what you found in your investigation first, so the allegations are clear.")
      .first(),
  ).toBeVisible();
  await owner.getByLabel("Who investigated").fill("Thabo Mokoena");
  await owner.getByLabel("Who raised the complaint").fill("Lerato Khumalo");
  await owner
    .getByLabel(/What the investigation found/)
    .fill(
      "Stock sheets and the cold-room log show the lamb was signed out by Sipho with no order.",
    );
  await owner.getByRole("button", { name: "Save details" }).click();
  await expect(owner).toHaveURL(/recorded=investigation/);
  await owner.getByRole("button", { name: /Continue/ }).click();
  await expect(owner).toHaveURL(/moved=notice/);

  // 3. Notice of hearing, then generate the PDF letter.
  await owner
    .getByLabel(/Allegations/)
    .fill("Dishonesty: removing 3 kg of lamb from the cold room without authorisation.");
  await owner.getByLabel("Notice given to the employee").fill(sastInput(0));
  await owner.getByLabel("Hearing date and time").fill(sastInput(7));
  await owner.getByLabel("Venue").fill("Back office, Kasi Kitchen");
  await owner.getByLabel("Chairperson").fill("Naledi Dlamini");
  await owner.getByRole("button", { name: "Save details" }).click();
  await expect(owner).toHaveURL(/recorded=notice/);
  await owner.getByRole("button", { name: "Generate PDF" }).click();
  await expect(owner).toHaveURL(/generated=notice/);
  await expect(owner.getByText(/Notice of hearing generated/)).toBeVisible();
  await owner.getByRole("button", { name: /Continue/ }).click();
  await expect(owner).toHaveURL(/moved=hearing/);

  // 4. Hearing and outcome.
  await owner.getByLabel("Yes").check();
  await owner
    .getByLabel(/side of the story/)
    .fill("Sipho says he took the lamb for a staff meal and forgot to record it.");
  await owner.getByRole("button", { name: "Save details" }).click();
  await expect(owner).toHaveURL(/recorded=hearing/);
  await owner.getByRole("button", { name: /Continue/ }).click();
  await expect(owner).toHaveURL(/moved=outcome/);
  await owner.getByRole("combobox", { name: /^Outcome/ }).selectOption("written");
  await owner
    .getByLabel(/^Reasons/)
    .fill("First offence and partly explained; a written warning is proportionate.");
  await owner.getByRole("button", { name: "Save details" }).click();
  await expect(owner).toHaveURL(/recorded=outcome/);

  // 5. Send for review.
  await owner
    .getByLabel("Note for your consultant (optional)")
    .fill("Please check the outcome before I issue the warning.");
  await owner.getByRole("button", { name: "Send for review" }).click();
  await expect(owner).toHaveURL(/review=sent/);

  // 6. The consultant approves.
  const consultant = await logIn(browser, "naledi@dlaminilabour.test", "/consultant");
  await expect(consultant.getByText("Sipho Ndlovu")).toBeVisible();
  await consultant.goto(`/consultant/cases/${caseId}`);
  await consultant
    .getByLabel("Comment", { exact: true })
    .fill("Fair process and a proportionate outcome. Approved.");
  await consultant.getByRole("button", { name: "Approve" }).click();
  await expect(consultant).toHaveURL(/reviewed=approved/);

  // 7. The owner sees the sign-off and exports the case bundle.
  await owner.goto(caseUrl);
  await expect(owner.getByText("Approved by consultant").first()).toBeVisible();
  const [download] = await Promise.all([
    owner.waitForEvent("download"),
    owner.getByRole("link", { name: /Export case bundle/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^FS-\d{4}-\d{4}-case-bundle\.pdf$/);

  // Exporting is recorded on the case timeline too.
  await owner.reload();
  await expect(owner.getByText(/exported the case bundle/)).toBeVisible();
});

test("a consultant can't open a case from a business they don't advise", async ({ browser }) => {
  const consultant = await logIn(browser, "naledi@dlaminilabour.test", "/consultant");
  await consultant.goto("/consultant/clients");
  await expect(consultant.getByText("Kasi Kitchen")).toBeVisible();
  await expect(consultant.getByText("Bakwena Build Contractors")).toHaveCount(0);
});
