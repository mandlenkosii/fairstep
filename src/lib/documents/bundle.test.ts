import { describe, expect, it } from "vitest";
import { buildBundle, type BundleInput } from "./bundle";

const input: BundleInput = {
  reference: "FS-2026-0003",
  businessName: "Kasi Kitchen",
  employee: { name: "Musa Dube", jobTitle: "Waiter", number: "KK-006" },
  category: "Late coming",
  reviewStatus: "approved",
  incident: {
    occurredAt: "2026-10-24T06:45:00Z",
    location: "Kasi Kitchen, Soweto",
    description: "Arrived 75 minutes late.",
    witnesses: ["Lerato Khumalo"],
  },
  workflow: {
    currentStep: "closed",
    closedAt: "2026-11-06T10:00:00Z",
    people: {
      complainant: "Lerato Khumalo",
      chairperson: "Naledi Dlamini",
      investigator: "Thabo Mokoena",
    },
    investigation: { findings: "Shift register shows three late arrivals." },
    notice: {
      allegations: ["Late coming on 3, 17 and 24 October 2026."],
      hearingAt: "2026-10-30T08:00:00Z",
    },
    hearing: { employeeAttended: true, employeeResponse: "Taxi strikes.", postponements: 0 },
    outcome: {
      sanction: "written",
      reasons: "Repeated late coming.",
      deliveredAt: "2026-10-30T12:00:00Z",
    },
  },
  events: [
    {
      type: "case.opened",
      payload: {},
      createdAt: "2026-10-26T07:00:00Z",
      actorName: "Thabo Mokoena",
      actorRole: "business_owner",
    },
    {
      type: "step.advanced",
      payload: { to: "investigation" },
      createdAt: "2026-10-26T07:10:00Z",
      actorName: "Thabo Mokoena",
      actorRole: "business_owner",
    },
    {
      type: "step.advanced",
      payload: { to: "notice" },
      createdAt: "2026-10-27T07:30:00Z",
      actorName: "Thabo Mokoena",
      actorRole: "business_owner",
    },
    {
      type: "step.advanced",
      payload: { to: "hearing" },
      createdAt: "2026-10-30T08:00:00Z",
      actorName: "Thabo Mokoena",
      actorRole: "business_owner",
    },
    {
      type: "step.advanced",
      payload: { to: "outcome" },
      createdAt: "2026-10-30T11:30:00Z",
      actorName: "Thabo Mokoena",
      actorRole: "business_owner",
    },
    {
      type: "review.approved",
      payload: {},
      createdAt: "2026-11-02T09:15:00Z",
      actorName: "Naledi Dlamini",
      actorRole: "consultant",
    },
    {
      type: "step.advanced",
      payload: { to: "closed" },
      createdAt: "2026-11-06T10:00:00Z",
      actorName: "Thabo Mokoena",
      actorRole: "business_owner",
    },
  ],
  comments: [
    {
      authorName: "Naledi Dlamini",
      authorRole: "consultant",
      body: "Approved.",
      createdAt: "2026-11-02T09:14:00Z",
    },
  ],
  documents: [
    { kind: "warning", fileName: "FS-2026-0003-warning.pdf", createdAt: "2026-10-30T12:05:00Z" },
  ],
  evidence: [{ fileName: "shift-register.jpg", createdAt: "2026-10-24T09:00:00Z" }],
  generatedAt: new Date("2026-11-23T08:00:00Z"),
  generatedBy: "Naledi Dlamini (Consultant)",
};

describe("buildBundle", () => {
  const bundle = buildBundle(input);

  it("has a cover with the reference, parties and a not-legal-advice note", () => {
    expect(bundle.cover).toMatchObject({
      title: "Disciplinary case record",
      reference: "FS-2026-0003",
      lines: [
        "Employer: Kasi Kitchen",
        "Employee: Musa Dube, Waiter (KK-006)",
        "Matter: Late coming",
        "Status: Closed · Approved by consultant",
      ],
    });
    expect(bundle.cover.generated).toBe(
      "Generated on 23 Nov 2026 at 10:00 SAST by Naledi Dlamini (Consultant)",
    );
    expect(bundle.footer).toContain("It is not legal advice.");
  });

  it("lists each step with when it was completed", () => {
    expect(bundle.checklist).toEqual([
      { step: "Incident", status: "Done", date: "24 Oct 2026" },
      { step: "Investigation", status: "Done", date: "26 Oct 2026" },
      { step: "Notice of hearing", status: "Done", date: "27 Oct 2026" },
      { step: "Hearing", status: "Done", date: "30 Oct 2026" },
      { step: "Outcome", status: "Done", date: "30 Oct 2026" },
      { step: "Appeal", status: "Not used", date: "" },
      { step: "Closed", status: "Done", date: "6 Nov 2026" },
    ]);
  });

  it("puts the timeline in date order with the actor and role", () => {
    expect(bundle.timeline[0]).toEqual({
      when: "Mon 26 Oct 2026, 09:00",
      who: "Thabo Mokoena (Owner)",
      what: "Opened the case",
    });
    expect(bundle.timeline.at(-2)).toMatchObject({
      who: "Naledi Dlamini (Consultant)",
      what: "Approved the case",
    });
  });

  it("summarises the record, evidence and documents", () => {
    const record = JSON.stringify(bundle.record);
    expect(record).toContain("Shift register shows three late arrivals.");
    expect(record).toContain("Taxi strikes.");
    expect(record).toContain("Written warning");
    expect(bundle.evidence).toEqual(["shift-register.jpg (added 24 Oct 2026)"]);
    expect(bundle.documents).toEqual(["Written warning: FS-2026-0003-warning.pdf (30 Oct 2026)"]);
  });
});
