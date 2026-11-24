import { describe, expect, it } from "vitest";
import { activityGrid, activityLevel } from "./activity";

const TODAY = new Date("2026-11-24T08:00:00Z"); // Tuesday 24 Nov 2026 (SAST)

describe("activityGrid", () => {
  it("covers whole weeks, Monday to Sunday, ending this week", () => {
    const grid = activityGrid([], TODAY, 12);
    expect(grid.weeks).toHaveLength(12);
    expect(grid.weeks.every((week) => week.length === 7)).toBe(true);
    expect(grid.weeks[11][0].date).toBe("2026-11-23"); // Monday of this week
    expect(grid.weeks[0][0].date).toBe("2026-09-07");
  });

  it("counts records per SAST day and marks days after today as future", () => {
    const grid = activityGrid(
      ["2026-11-23T08:00:00Z", "2026-11-23T21:30:00Z", "2026-11-23T22:30:00Z"],
      TODAY,
      12,
    );
    const thisWeek = grid.weeks[11];
    expect(thisWeek[0].count).toBe(2); // Mon 23 Nov (22:30 UTC is Tue in SAST)
    expect(thisWeek[1].count).toBe(1); // Tue 24 Nov
    expect(thisWeek[2].future).toBe(true);
    expect(grid.total).toBe(3);
  });

  it("ignores records older than the window", () => {
    expect(activityGrid(["2026-01-05T08:00:00Z"], TODAY, 12).total).toBe(0);
  });
});

describe("activityLevel", () => {
  it("maps counts to five shades relative to the busiest day", () => {
    expect(activityLevel(0, 8)).toBe(0);
    expect(activityLevel(1, 8)).toBe(1);
    expect(activityLevel(4, 8)).toBe(2);
    expect(activityLevel(6, 8)).toBe(3);
    expect(activityLevel(8, 8)).toBe(4);
  });
});
