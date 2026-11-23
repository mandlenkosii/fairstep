import { describe, expect, it } from "vitest";
import { buildStepperSteps, caseToWorkflow, eventLabel, type CaseRow } from "./view";

const NOW = new Date("2026-11-23T08:00:00Z");

const row: CaseRow = {
  current_step: "investigation",
  closed_at: null,
  complainant_name: "Lerato Khumalo",
  chairperson_name: null,
  step_data: {},
  incident: {
    occurred_at: "2026-11-09T19:30:00Z",
    witnesses: ["Nomvula Zulu (Supervisor)", "Sipho Ndlovu"],
  },
};

describe("caseToWorkflow", () => {
  it("builds the rules engine's input from a case row", () => {
    const c = caseToWorkflow({
      ...row,
      chairperson_name: "Naledi Dlamini",
      step_data: { investigation: { findings: "CCTV checked.", investigator: "Thabo Mokoena" } },
    });
    expect(c.currentStep).toBe("investigation");
    expect(c.incidentOccurredAt).toBe("2026-11-09T19:30:00Z");
    expect(c.investigation?.findings).toBe("CCTV checked.");
    expect(c.people).toEqual({
      complainant: "Lerato Khumalo",
      chairperson: "Naledi Dlamini",
      investigator: "Thabo Mokoena",
      witnesses: ["Nomvula Zulu", "Sipho Ndlovu"],
    });
  });

  it("ignores step data that isn't an object", () => {
    expect(caseToWorkflow({ ...row, step_data: "oops" }).investigation).toBeUndefined();
  });
});

describe("buildStepperSteps", () => {
  it("marks earlier steps done, the current one current, and blocks the next with the rule's reason", () => {
    const steps = buildStepperSteps(caseToWorkflow(row), NOW);
    expect(steps.map((s) => [s.key, s.status])).toEqual([
      ["incident", "completed"],
      ["investigation", "current"],
      ["notice", "blocked"],
      ["hearing", "upcoming"],
      ["outcome", "upcoming"],
      ["appeal", "upcoming"],
    ]);
    expect(steps[2].reason).toBe(
      "Record what you found in your investigation first, so the allegations are clear.",
    );
    expect(steps[5].optional).toBe(true);
  });

  it("leaves the next step open when the rules allow it", () => {
    const steps = buildStepperSteps(
      caseToWorkflow({ ...row, step_data: { investigation: { findings: "Done." } } }),
      NOW,
    );
    expect(steps[2]).toMatchObject({ key: "notice", status: "upcoming" });
    expect(steps[2].reason).toBeUndefined();
  });

  it("shows every step as done on a closed case, and an unused appeal as skipped", () => {
    const steps = buildStepperSteps(
      caseToWorkflow({ ...row, current_step: "closed", closed_at: "2026-11-06T10:00:00Z" }),
      NOW,
    );
    expect(steps.slice(0, 5).every((s) => s.status === "completed")).toBe(true);
    expect(steps[5]).toMatchObject({ key: "appeal", status: "upcoming", detail: "Not used" });
  });
});

describe("eventLabel", () => {
  it("describes timeline events in plain words", () => {
    expect(eventLabel("case.opened", {})).toBe("Opened the case");
    expect(eventLabel("step.advanced", { from: "investigation", to: "notice" })).toBe(
      "Moved the case to Notice of hearing",
    );
    expect(eventLabel("review.changes_requested", {})).toBe("Requested changes");
    expect(eventLabel("step.recorded", { step: "notice" })).toBe(
      "Recorded the notice of hearing details",
    );
    expect(eventLabel("something.new", {})).toBe("Updated the case");
  });
});
