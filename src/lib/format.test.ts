import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, initials } from "./format";

describe("formatDate", () => {
  it("shows a plain date the South African way", () => {
    expect(formatDate("2019-03-01")).toBe("1 Mar 2019");
  });

  it("shows a timestamp's SAST day", () => {
    expect(formatDate("2026-11-24T23:30:00Z")).toBe("25 Nov 2026");
  });

  it("shows a dash for nothing", () => {
    expect(formatDate(null)).toBe("–");
  });
});

describe("formatDateTime", () => {
  it("shows weekday, date and SAST time", () => {
    expect(formatDateTime("2026-11-09T19:30:00Z")).toBe("Mon 9 Nov 2026, 21:30");
  });
});

describe("initials", () => {
  it("takes the first letter of the first and last name", () => {
    expect(initials("Pieter van Wyk")).toBe("PW");
    expect(initials("Sipho")).toBe("S");
  });
});
