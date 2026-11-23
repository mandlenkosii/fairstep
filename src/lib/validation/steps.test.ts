import { describe, expect, it } from "vitest";
import { parseStep, sastInputToUtc, utcToSastInput } from "./steps";

describe("SAST date-time inputs", () => {
  it("converts a SAST form value to UTC and back", () => {
    expect(sastInputToUtc("2026-11-26T10:00")).toBe("2026-11-26T08:00:00.000Z");
    expect(utcToSastInput("2026-11-26T08:00:00Z")).toBe("2026-11-26T10:00");
    expect(utcToSastInput(undefined)).toBe("");
  });
});

describe("investigation", () => {
  it("needs findings and keeps the investigator and complainant", () => {
    const result = parseStep("investigation", {
      investigator: "Thabo Mokoena",
      complainant: "Lerato Khumalo",
      findings: "CCTV shows the drawer open from 19:12 to 19:22.",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        section: {
          investigator: "Thabo Mokoena",
          findings: "CCTV shows the drawer open from 19:12 to 19:22.",
        },
        columns: { complainant_name: "Lerato Khumalo" },
      },
    });
  });

  it("explains missing findings", () => {
    const result = parseStep("investigation", { investigator: "", complainant: "", findings: "" });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.fieldErrors.findings).toBe(
      "Write down what the investigation found.",
    );
  });
});

describe("notice", () => {
  const notice = {
    allegations: "Negligence: left the cash drawer open on 9 Nov 2026.\n\n",
    deliveredAt: "2026-11-23T10:00",
    hearingAt: "2026-11-26T10:00",
    venue: "Back office",
    chairperson: "Naledi Dlamini",
    representation: "on",
    interpreter: "on",
    witnesses: "on",
  };

  it("stores allegations as a list, times in UTC, and the rights given", () => {
    const result = parseStep("notice", notice);
    expect(result.ok && result.data).toEqual({
      section: {
        allegations: ["Negligence: left the cash drawer open on 9 Nov 2026."],
        deliveredAt: "2026-11-23T08:00:00.000Z",
        hearingAt: "2026-11-26T08:00:00.000Z",
        venue: "Back office",
        rights: { representation: true, interpreter: true, witnesses: true },
      },
      columns: { chairperson_name: "Naledi Dlamini", hearing_at: "2026-11-26T08:00:00.000Z" },
    });
  });

  it("lets the rights be saved unticked (the workflow rule blocks the hearing instead)", () => {
    const rest = { ...notice, interpreter: undefined };
    const result = parseStep("notice", rest);
    expect(result.ok && result.data.section).toMatchObject({
      rights: { representation: true, interpreter: false, witnesses: true },
    });
  });

  it("needs at least one allegation", () => {
    const result = parseStep("notice", { ...notice, allegations: " " });
    expect(!result.ok && result.fieldErrors.allegations).toBe("List at least one allegation.");
  });

  it("accepts a draft notice without dates yet", () => {
    const result = parseStep("notice", { ...notice, deliveredAt: "", hearingAt: "" });
    expect(result.ok && result.data.section).toMatchObject({
      deliveredAt: undefined,
      hearingAt: undefined,
    });
  });
});

describe("hearing", () => {
  it("records attendance, response and postponements", () => {
    const result = parseStep("hearing", {
      employeeAttended: "yes",
      employeeResponse: "I helped a customer and forgot to lock the drawer.",
      noResponseReason: "",
      postponements: "0",
    });
    expect(result.ok && result.data.section).toEqual({
      employeeAttended: true,
      employeeResponse: "I helped a customer and forgot to lock the drawer.",
      noResponseReason: undefined,
      postponements: 0,
    });
  });

  it("needs to know whether the employee attended", () => {
    const result = parseStep("hearing", { employeeAttended: "", postponements: "0" });
    expect(!result.ok && result.fieldErrors.employeeAttended).toBe(
      "Say whether the employee attended.",
    );
  });
});

describe("outcome", () => {
  it("records the sanction, reasons and valid prior warnings", () => {
    const result = parseStep("outcome", {
      sanction: "final_written",
      reasons: "Second offence within six months.",
      deliveredAt: "2026-11-27T12:00",
      warning1Kind: "written",
      warning1IssuedOn: "2026-08-01",
      warning2Kind: "",
      warning2IssuedOn: "",
    });
    expect(result.ok && result.data).toEqual({
      section: {
        sanction: "final_written",
        reasons: "Second offence within six months.",
        deliveredAt: "2026-11-27T10:00:00.000Z",
        priorWarnings: [{ kind: "written", issuedOn: "2026-08-01" }],
      },
      columns: { outcome: "final_written" },
    });
  });

  it("needs a sanction", () => {
    const result = parseStep("outcome", { sanction: "", reasons: "" });
    expect(!result.ok && result.fieldErrors.sanction).toBe("Choose the outcome.");
  });
});

describe("appeal", () => {
  it("records when it was lodged and the decision", () => {
    const result = parseStep("appeal", {
      lodgedAt: "2026-12-01T09:00",
      decision: "Warning upheld.",
    });
    expect(result.ok && result.data.section).toEqual({
      lodgedAt: "2026-12-01T07:00:00.000Z",
      decision: "Warning upheld.",
    });
  });
});
