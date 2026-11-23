import { describe, expect, it } from "vitest";
import type { WorkflowCase } from "@/lib/workflow/types";
import { attentionItems, documentedPercent, isDocumented, type DashboardCase } from "./dashboard";

const NOW = new Date("2026-11-23T08:00:00Z"); // Mon 23 Nov, 10:00 SAST

const wf = (over: Partial<WorkflowCase>): WorkflowCase => ({
  currentStep: "investigation",
  people: {},
  ...over,
});

const dc = (over: Partial<DashboardCase> & { workflow: WorkflowCase }): DashboardCase => ({
  id: "c1",
  reference: "FS-2026-0001",
  employeeName: "Bongani Mthembu",
  reviewStatus: "not_requested",
  ...over,
});

describe("isDocumented", () => {
  it("is true when every step reached so far has its details", () => {
    expect(isDocumented(wf({ currentStep: "investigation" }))).toBe(true);
    expect(
      isDocumented(
        wf({
          currentStep: "hearing",
          investigation: { findings: "CCTV checked." },
          notice: { allegations: ["Negligence."], deliveredAt: "2026-11-20T08:00:00Z" },
        }),
      ),
    ).toBe(true);
  });

  it("is false when a passed step is missing its record", () => {
    expect(isDocumented(wf({ currentStep: "notice", investigation: {} }))).toBe(false);
    expect(
      isDocumented(
        wf({
          currentStep: "outcome",
          investigation: { findings: "x" },
          notice: { allegations: ["x"], deliveredAt: "2026-11-20T08:00:00Z" },
          hearing: { employeeAttended: true },
        }),
      ),
    ).toBe(false);
  });
});

describe("documentedPercent", () => {
  it("rounds to a whole percentage and handles no cases", () => {
    const ok = wf({ currentStep: "investigation" });
    const bad = wf({ currentStep: "notice" });
    expect(documentedPercent([ok, ok, bad])).toBe(67);
    expect(documentedPercent([])).toBeNull();
  });
});

describe("attentionItems", () => {
  it("lists requested changes first, then hearings this week, then blocked steps", () => {
    const items = attentionItems(
      [
        dc({ id: "blocked", workflow: wf({ currentStep: "investigation" }) }),
        dc({
          id: "hearing",
          employeeName: "Thandiwe Sithole",
          workflow: wf({
            currentStep: "hearing",
            notice: { hearingAt: "2026-11-26T08:00:00Z" },
            investigation: { findings: "x" },
          }),
        }),
        dc({
          id: "changes",
          reviewStatus: "changes_requested",
          workflow: wf({ currentStep: "notice" }),
        }),
      ],
      NOW,
    );
    expect(items.map((i) => i.caseId)).toEqual(["changes", "hearing", "blocked"]);
    expect(items[0]).toMatchObject({ title: "Your consultant asked for changes", tone: "danger" });
    expect(items[1]).toMatchObject({
      title: "Hearing for Thandiwe Sithole",
      detail: "Thu 26 Nov at 10:00",
    });
    expect(items[2]).toMatchObject({
      title: "Bongani Mthembu: next step blocked",
      detail: "Record what you found in your investigation first, so the allegations are clear.",
    });
  });

  it("ignores hearings that are past or more than 7 days away, and closed cases", () => {
    const items = attentionItems(
      [
        dc({
          id: "past",
          workflow: wf({
            currentStep: "notice",
            notice: { hearingAt: "2026-11-20T08:00:00Z" },
            investigation: { findings: "x" },
          }),
        }),
        dc({
          id: "far",
          workflow: wf({
            currentStep: "notice",
            notice: { hearingAt: "2026-12-10T08:00:00Z" },
            investigation: { findings: "x" },
          }),
        }),
        dc({ id: "closed", workflow: wf({ currentStep: "closed" }) }),
      ],
      NOW,
    );
    expect(items.filter((i) => i.kind === "hearing")).toEqual([]);
    expect(items.some((i) => i.caseId === "closed")).toBe(false);
  });
});
