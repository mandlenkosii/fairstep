import { describe, expect, it } from "vitest";
import {
  addMonths,
  addWorkingDays,
  formatDayMonth,
  formatFullDate,
  isWorkingDay,
  toSastDate,
} from "./dates";

describe("toSastDate", () => {
  it("keeps a plain date as it is", () => {
    expect(toSastDate("2026-11-24")).toBe("2026-11-24");
  });

  it("converts a UTC timestamp to the SAST calendar day", () => {
    expect(toSastDate("2026-11-24T08:00:00Z")).toBe("2026-11-24");
    // 23:30 UTC is already 01:30 the next day in South Africa.
    expect(toSastDate("2026-11-24T23:30:00Z")).toBe("2026-11-25");
    expect(toSastDate(new Date("2026-11-24T21:59:00Z"))).toBe("2026-11-24");
    expect(toSastDate(new Date("2026-11-24T22:00:00Z"))).toBe("2026-11-25");
  });
});

describe("isWorkingDay", () => {
  it("counts Monday to Friday", () => {
    expect(isWorkingDay("2026-11-23")).toBe(true); // Monday
    expect(isWorkingDay("2026-11-27")).toBe(true); // Friday
  });

  it("skips weekends", () => {
    expect(isWorkingDay("2026-11-28")).toBe(false); // Saturday
    expect(isWorkingDay("2026-11-29")).toBe(false); // Sunday
  });

  it("skips South African public holidays", () => {
    expect(isWorkingDay("2026-12-16")).toBe(false); // Day of Reconciliation (Wednesday)
    expect(isWorkingDay("2026-08-10")).toBe(false); // Women's Day moved to Monday
  });
});

describe("addWorkingDays", () => {
  it("adds working days within a week", () => {
    expect(addWorkingDays("2026-11-24", 2)).toBe("2026-11-26"); // Tue → Thu
  });

  it("jumps over a weekend", () => {
    expect(addWorkingDays("2026-11-26", 2)).toBe("2026-11-30"); // Thu → Mon
    expect(addWorkingDays("2026-11-21", 5)).toBe("2026-11-27"); // Sat → Fri
  });

  it("jumps over public holidays", () => {
    // Tue 15 Dec + 2: Wed 16 Dec is a holiday, so Thu 17 and Fri 18.
    expect(addWorkingDays("2026-12-15", 2)).toBe("2026-12-18");
    // Thu 24 Dec + 1: Fri 25 Dec and Sat 26 Dec are holidays, then the weekend.
    expect(addWorkingDays("2026-12-24", 1)).toBe("2026-12-28");
    // Over Easter 2026: Good Friday 3 Apr and Family Day 6 Apr.
    expect(addWorkingDays("2026-04-02", 1)).toBe("2026-04-07");
  });

  it("returns the same day for zero", () => {
    expect(addWorkingDays("2026-11-28", 0)).toBe("2026-11-28");
  });
});

describe("addMonths", () => {
  it("adds calendar months", () => {
    expect(addMonths("2025-11-03", 6)).toBe("2026-05-03");
    expect(addMonths("2026-01-15", 12)).toBe("2027-01-15");
  });

  it("clamps to the end of a shorter month", () => {
    expect(addMonths("2026-08-31", 6)).toBe("2027-02-28");
  });
});

describe("date labels", () => {
  it("formats a short day label", () => {
    expect(formatDayMonth("2026-11-26")).toBe("Thu 26 Nov");
  });

  it("formats a full date", () => {
    expect(formatFullDate("2026-05-03")).toBe("3 May 2026");
  });
});
