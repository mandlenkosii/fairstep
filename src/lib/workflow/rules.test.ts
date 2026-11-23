import { describe, expect, it } from "vitest";
import {
  appealDeadline,
  canEditCase,
  canTransition,
  earliestHearingDate,
  nextSteps,
  warningExpiry,
} from "./rules";
import type { RuleCode, WorkflowCase } from "./types";

const NOW = new Date("2026-11-23T08:00:00Z"); // Mon 23 Nov 2026, 10:00 SAST

/** A case with every step filled in fairly. Each test breaks one thing. */
function fairCase(overrides: Partial<WorkflowCase> = {}): WorkflowCase {
  return {
    currentStep: "incident",
    closedAt: null,
    incidentOccurredAt: "2026-11-10T07:30:00Z",
    people: {
      complainant: "Sipho Ndlovu",
      investigator: "Lerato Khumalo",
      chairperson: "Naledi Dlamini",
      witnesses: ["Ayanda Zulu"],
    },
    investigation: {
      findings: "Till short by R1,200 on 9 Nov; CCTV shows the cash drawer left open.",
    },
    notice: {
      allegations: ["Negligence: leaving the cash drawer open and unattended on 9 Nov 2026."],
      deliveredAt: "2026-11-24T08:00:00Z", // Tue 24 Nov
      hearingAt: "2026-11-26T08:00:00Z", // Thu 26 Nov
      venue: "Back office, Kasi Kitchen, Soweto",
      rights: { representation: true, interpreter: true, witnesses: true },
    },
    hearing: {
      employeeAttended: true,
      employeeResponse: "I stepped away to help a customer and forgot to lock the drawer.",
      postponements: 0,
    },
    outcome: {
      sanction: "written",
      reasons: "First offence; employee admitted the mistake.",
      deliveredAt: "2026-11-27T10:00:00Z", // Fri 27 Nov
      priorWarnings: [],
    },
    appeal: { lodgedAt: "2026-12-01T08:00:00Z", decision: "Warning upheld." },
    ...overrides,
  };
}

function at(step: WorkflowCase["currentStep"], overrides: Partial<WorkflowCase> = {}) {
  return fairCase({ ...overrides, currentStep: step });
}

function codes(result: ReturnType<typeof canTransition>): RuleCode[] {
  return result.ok ? [] : result.reasons.map((reason) => reason.code);
}

describe("canTransition: a fair case moves through every step", () => {
  it.each([
    ["incident", "investigation"],
    ["investigation", "notice"],
    ["notice", "hearing"],
    ["hearing", "outcome"],
    ["outcome", "appeal"],
    ["outcome", "closed"],
    ["appeal", "closed"],
  ] as const)("%s → %s", (from, to) => {
    expect(canTransition(at(from), to, NOW)).toEqual({ ok: true });
  });
});

describe("R1 step order", () => {
  it("blocks jumping ahead", () => {
    const result = canTransition(at("notice"), "outcome", NOW);
    expect(codes(result)).toEqual(["step_order"]);
    expect(result.ok || result.reasons[0].message).toBe(
      "Finish the hearing step before you record the outcome.",
    );
  });

  it("blocks the hearing before a notice", () => {
    const result = canTransition(at("investigation"), "hearing", NOW);
    expect(result.ok || result.reasons[0].message).toBe(
      "You need to issue a notice of hearing before the hearing can take place.",
    );
  });

  it("blocks going backwards and staying on the same step", () => {
    expect(codes(canTransition(at("hearing"), "notice", NOW))).toEqual(["step_order"]);
    expect(codes(canTransition(at("hearing"), "hearing", NOW))).toEqual(["step_order"]);
  });

  it("only offers the next steps", () => {
    expect(nextSteps("hearing")).toEqual(["outcome"]);
    expect(nextSteps("outcome")).toEqual(["appeal", "closed"]);
    expect(nextSteps("closed")).toEqual([]);
  });
});

describe("R2 investigation findings", () => {
  it("blocks the notice without findings", () => {
    const result = canTransition(
      at("investigation", { investigation: { findings: "   " } }),
      "notice",
      NOW,
    );
    expect(codes(result)).toEqual(["investigation_findings_missing"]);
    expect(result.ok || result.reasons[0].message).toBe(
      "Record what you found in your investigation first, so the allegations are clear.",
    );
  });
});

describe("R3 minimum notice", () => {
  it("works out the earliest fair hearing date", () => {
    expect(earliestHearingDate("2026-11-24T08:00:00Z")).toBe("2026-11-26"); // Tue → Thu
    expect(earliestHearingDate("2026-11-26T08:00:00Z")).toBe("2026-11-30"); // Thu → Mon
    expect(earliestHearingDate("2026-12-15T08:00:00Z")).toBe("2026-12-18"); // over 16 Dec
  });

  it("blocks a hearing with too little notice and names the earliest fair date", () => {
    const fair = fairCase();
    const result = canTransition(
      at("notice", {
        notice: {
          ...fair.notice!,
          deliveredAt: "2026-11-24T08:00:00Z",
          hearingAt: "2026-11-25T08:00:00Z",
        },
      }),
      "hearing",
      NOW,
    );
    expect(codes(result)).toEqual(["notice_too_short"]);
    expect(result.ok || result.reasons[0].message).toBe(
      "The employee must get at least 2 working days to prepare. The earliest fair date is Thu 26 Nov.",
    );
  });

  it("does not count weekends as preparation time", () => {
    const fair = fairCase();
    const notice = { ...fair.notice!, deliveredAt: "2026-11-27T08:00:00Z" }; // Friday
    expect(
      codes(
        canTransition(
          at("notice", { notice: { ...notice, hearingAt: "2026-11-30T08:00:00Z" } }),
          "hearing",
          NOW,
        ),
      ),
    ).toEqual(["notice_too_short"]);
    expect(
      canTransition(
        at("notice", { notice: { ...notice, hearingAt: "2026-12-01T08:00:00Z" } }),
        "hearing",
        NOW,
      ),
    ).toEqual({ ok: true });
  });

  it("does not count public holidays as preparation time", () => {
    const fair = fairCase();
    const notice = { ...fair.notice!, deliveredAt: "2026-12-15T08:00:00Z" }; // Tue, before 16 Dec
    expect(
      codes(
        canTransition(
          at("notice", { notice: { ...notice, hearingAt: "2026-12-17T08:00:00Z" } }),
          "hearing",
          NOW,
        ),
      ),
    ).toEqual(["notice_too_short"]);
  });

  it("uses the SAST date, not the UTC date", () => {
    const fair = fairCase();
    // Delivered 23:30 UTC on Mon 23 Nov = 01:30 SAST on Tue 24 Nov, so Wed 25 Nov is too early.
    const notice = {
      ...fair.notice!,
      deliveredAt: "2026-11-23T23:30:00Z",
      hearingAt: "2026-11-25T08:00:00Z",
    };
    expect(codes(canTransition(at("notice", { notice }), "hearing", NOW))).toEqual([
      "notice_too_short",
    ]);
  });

  it("blocks the hearing when the notice was never delivered", () => {
    const fair = fairCase();
    const result = canTransition(
      at("notice", { notice: { ...fair.notice!, deliveredAt: undefined } }),
      "hearing",
      NOW,
    );
    expect(codes(result)).toEqual(["notice_not_delivered"]);
  });
});

describe("R4 notice content", () => {
  const fair = fairCase();

  it.each([
    ["no allegations", { allegations: [] }],
    ["a blank allegation only", { allegations: [" "] }],
    ["no hearing date", { hearingAt: undefined }],
    ["no venue", { venue: "" }],
    [
      "the right to representation missing",
      { rights: { representation: false, interpreter: true, witnesses: true } },
    ],
    [
      "the right to an interpreter missing",
      { rights: { representation: true, interpreter: false, witnesses: true } },
    ],
    [
      "the right to call witnesses missing",
      { rights: { representation: true, interpreter: true, witnesses: false } },
    ],
  ])("blocks a notice with %s", (_label, change) => {
    const result = canTransition(
      at("notice", { notice: { ...fair.notice!, ...change } }),
      "hearing",
      NOW,
    );
    expect(codes(result)).toContain("notice_incomplete");
  });

  it("explains what the notice must contain", () => {
    const result = canTransition(
      at("notice", { notice: { ...fair.notice!, allegations: [] } }),
      "hearing",
      NOW,
    );
    expect(result.ok || result.reasons[0].message).toBe(
      "The notice must list the allegations, the hearing date, time and venue, and the employee's rights.",
    );
  });
});

describe("R5 impartial chairperson", () => {
  const fair = fairCase();

  it("blocks a hearing without a chairperson", () => {
    const result = canTransition(
      at("notice", { people: { ...fair.people, chairperson: "" } }),
      "hearing",
      NOW,
    );
    expect(codes(result)).toEqual(["chairperson_missing"]);
  });

  it("blocks a chairperson who is the complainant, ignoring case and spaces", () => {
    const result = canTransition(
      at("notice", { people: { ...fair.people, chairperson: "  sipho   NDLOVU " } }),
      "hearing",
      NOW,
    );
    expect(codes(result)).toEqual(["chairperson_not_impartial"]);
    expect(result.ok || result.reasons[0].message).toBe(
      "The chairperson can't also be the complainant. Choose someone who wasn't involved.",
    );
  });

  it("blocks a chairperson who investigated the case", () => {
    const result = canTransition(
      at("notice", { people: { ...fair.people, chairperson: "Lerato Khumalo" } }),
      "hearing",
      NOW,
    );
    expect(result.ok || result.reasons[0].message).toBe(
      "The chairperson can't also be the investigator. Choose someone who wasn't involved.",
    );
  });

  it("blocks a chairperson who is a witness", () => {
    const result = canTransition(
      at("notice", { people: { ...fair.people, chairperson: "Ayanda Zulu" } }),
      "hearing",
      NOW,
    );
    expect(result.ok || result.reasons[0].message).toBe(
      "The chairperson can't also be a witness. Choose someone who wasn't involved.",
    );
  });

  it("checks the chairperson again before the outcome", () => {
    const result = canTransition(
      at("hearing", { people: { ...fair.people, chairperson: "Sipho Ndlovu" } }),
      "outcome",
      NOW,
    );
    expect(codes(result)).toContain("chairperson_not_impartial");
  });
});

describe("R6 right to respond", () => {
  it("blocks the outcome when the employee attended but their response is missing", () => {
    const result = canTransition(
      at("hearing", {
        hearing: { employeeAttended: true, employeeResponse: "", postponements: 0 },
      }),
      "outcome",
      NOW,
    );
    expect(codes(result)).toEqual(["employee_response_missing"]);
    expect(result.ok || result.reasons[0].message).toBe(
      "Record the employee's side of the story before deciding the outcome.",
    );
  });

  it("blocks the outcome for a no-show without a recorded reason", () => {
    const result = canTransition(
      at("hearing", { hearing: { employeeAttended: false, postponements: 1 } }),
      "outcome",
      NOW,
    );
    expect(codes(result)).toEqual(["employee_response_missing"]);
  });

  it("allows the outcome for a no-show after a postponement with a recorded reason", () => {
    const result = canTransition(
      at("hearing", {
        hearing: {
          employeeAttended: false,
          postponements: 1,
          noResponseReason: "Did not attend the postponed hearing on 1 Dec and gave no reason.",
        },
      }),
      "outcome",
      NOW,
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("R7 postponement on non-attendance", () => {
  it("blocks going ahead without the employee at the first no-show", () => {
    const result = canTransition(
      at("hearing", {
        hearing: { employeeAttended: false, postponements: 0, noResponseReason: "Did not arrive." },
      }),
      "outcome",
      NOW,
    );
    expect(codes(result)).toEqual(["postpone_first"]);
    expect(result.ok || result.reasons[0].message).toBe(
      "Postpone once and re-notify the employee before continuing without them.",
    );
  });

  it("blocks the outcome if the hearing was never recorded", () => {
    const result = canTransition(at("hearing", { hearing: undefined }), "outcome", NOW);
    expect(codes(result)).toEqual(["employee_response_missing"]);
  });
});

describe("R8 sanction justification", () => {
  it("blocks closing a case with no outcome recorded", () => {
    const result = canTransition(at("outcome", { outcome: undefined }), "closed", NOW);
    expect(codes(result)).toEqual(["outcome_missing"]);
  });

  it("blocks a dismissal without reasons", () => {
    const result = canTransition(
      at("outcome", {
        outcome: { sanction: "dismissal", reasons: " ", deliveredAt: "2026-11-27T10:00:00Z" },
      }),
      "closed",
      NOW,
    );
    expect(codes(result)).toEqual(["dismissal_reasons_missing"]);
    expect(result.ok || result.reasons[0].message).toBe(
      "Explain why dismissal is appropriate, including any prior valid warnings.",
    );
  });

  it("allows a dismissal with reasons", () => {
    const result = canTransition(
      at("outcome", {
        outcome: {
          sanction: "dismissal",
          reasons: "Gross dishonesty: theft of R1,200 admitted; trust broken.",
          deliveredAt: "2026-11-27T10:00:00Z",
        },
      }),
      "closed",
      NOW,
    );
    expect(result).toEqual({ ok: true });
  });

  it("allows a warning without detailed reasons", () => {
    const result = canTransition(
      at("outcome", {
        outcome: { sanction: "verbal", deliveredAt: "2026-11-27T10:00:00Z" },
      }),
      "closed",
      NOW,
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("R9 appeal window", () => {
  it("works out the last day to appeal", () => {
    expect(appealDeadline("2026-11-20T10:00:00Z")).toBe("2026-11-27"); // Fri → Fri
    expect(appealDeadline("2026-12-11T10:00:00Z")).toBe("2026-12-21"); // over 16 Dec
  });

  it("allows an appeal on the last day", () => {
    const result = canTransition(
      at("outcome", {
        outcome: { sanction: "written", deliveredAt: "2026-11-20T10:00:00Z" },
        appeal: { lodgedAt: "2026-11-27T14:00:00Z" },
      }),
      "appeal",
      NOW,
    );
    expect(result).toEqual({ ok: true });
  });

  it("blocks an appeal after the window closes", () => {
    const result = canTransition(
      at("outcome", {
        outcome: { sanction: "written", deliveredAt: "2026-11-20T10:00:00Z" },
        appeal: { lodgedAt: "2026-11-30T08:00:00Z" },
      }),
      "appeal",
      NOW,
    );
    expect(codes(result)).toEqual(["appeal_window_closed"]);
    expect(result.ok || result.reasons[0].message).toBe("The appeal period ended on Fri 27 Nov.");
  });

  it("uses today when no lodge date is recorded", () => {
    const outcome = { sanction: "written" as const, deliveredAt: "2026-11-10T10:00:00Z" };
    expect(
      codes(canTransition(at("outcome", { outcome, appeal: undefined }), "appeal", NOW)),
    ).toEqual(["appeal_window_closed"]);
  });

  it("blocks an appeal before the outcome was delivered", () => {
    const result = canTransition(
      at("outcome", { outcome: { sanction: "written" } }),
      "appeal",
      NOW,
    );
    expect(codes(result)).toEqual(["outcome_not_delivered"]);
  });

  it("blocks closing an appeal without a decision", () => {
    const result = canTransition(
      at("appeal", { appeal: { lodgedAt: "2026-12-01T08:00:00Z" } }),
      "closed",
      NOW,
    );
    expect(codes(result)).toEqual(["appeal_decision_missing"]);
  });
});

describe("R10 warning validity", () => {
  it("works out when a warning expires", () => {
    expect(warningExpiry({ kind: "written", issuedOn: "2025-11-03" })).toBe("2026-05-03");
    expect(warningExpiry({ kind: "final_written", issuedOn: "2025-11-03" })).toBe("2026-11-03");
  });

  it("blocks counting an expired written warning", () => {
    const result = canTransition(
      at("outcome", {
        outcome: {
          sanction: "final_written",
          deliveredAt: "2026-11-27T10:00:00Z",
          priorWarnings: [{ kind: "written", issuedOn: "2025-11-03" }],
        },
      }),
      "closed",
      NOW,
    );
    expect(codes(result)).toEqual(["expired_warning_counted"]);
    expect(result.ok || result.reasons[0].message).toBe(
      "This warning expired on 3 May 2026 and can't be counted.",
    );
  });

  it("counts a final warning that was still valid when the incident happened", () => {
    const result = canTransition(
      at("outcome", {
        outcome: {
          sanction: "dismissal",
          reasons: "Repeat offence within the final warning period.",
          deliveredAt: "2026-11-27T10:00:00Z",
          priorWarnings: [{ kind: "final_written", issuedOn: "2026-01-15" }],
        },
      }),
      "closed",
      NOW,
    );
    expect(result).toEqual({ ok: true });
  });

  it("judges validity on the incident date, not today", () => {
    // Expired 3 May 2026, but the incident was on 30 Apr 2026.
    const result = canTransition(
      at("outcome", {
        incidentOccurredAt: "2026-04-30T09:00:00Z",
        outcome: {
          sanction: "final_written",
          deliveredAt: "2026-11-27T10:00:00Z",
          priorWarnings: [{ kind: "written", issuedOn: "2025-11-03" }],
        },
      }),
      "closed",
      NOW,
    );
    expect(result).toEqual({ ok: true });
  });
});

describe("R11 locked after close", () => {
  it("blocks every transition on a closed case", () => {
    const result = canTransition(at("closed"), "appeal", NOW);
    expect(codes(result)).toEqual(["case_closed"]);
    expect(result.ok || result.reasons[0].message).toBe(
      "This case is closed. Add a note instead of changing the record.",
    );
  });

  it("treats a case with a close date as closed", () => {
    const result = canTransition(
      at("hearing", { closedAt: "2026-11-30T08:00:00Z" }),
      "outcome",
      NOW,
    );
    expect(codes(result)).toEqual(["case_closed"]);
  });

  it("stops edits once a case is closed", () => {
    expect(canEditCase(at("hearing"))).toBe(true);
    expect(canEditCase(at("closed"))).toBe(false);
    expect(canEditCase(at("outcome", { closedAt: "2026-11-30T08:00:00Z" }))).toBe(false);
  });
});

describe("several problems at once", () => {
  it("reports every reason so the owner can fix them together", () => {
    const fair = fairCase();
    const result = canTransition(
      at("notice", {
        people: { ...fair.people, chairperson: "Sipho Ndlovu" },
        notice: { ...fair.notice!, venue: "", hearingAt: "2026-11-25T08:00:00Z" },
      }),
      "hearing",
      NOW,
    );
    expect(codes(result)).toEqual([
      "notice_incomplete",
      "notice_too_short",
      "chairperson_not_impartial",
    ]);
  });

  it("does not mutate the case", () => {
    const input = at("notice");
    const copy = structuredClone(input);
    canTransition(input, "hearing", NOW);
    expect(input).toEqual(copy);
  });
});
