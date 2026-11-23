import { describe, expect, it } from "vitest";
import {
  CATEGORY_LABEL,
  evidencePath,
  evidenceProblem,
  incidentSchema,
  parseWitnesses,
} from "./incident";

const NOW = new Date("2026-11-23T15:00:00Z"); // 17:00 SAST
const valid = {
  employeeId: "6f1c2b9e-0d3a-4b8e-9f2a-1c2d3e4f5a6b",
  date: "2026-11-19",
  time: "17:40",
  location: "Front till",
  category: "dishonesty",
  description: "At cash-up the till was R850 short.",
  witnesses: "Nomvula Zulu (Supervisor)\n\n  Sipho Ndlovu  ",
};

describe("incidentSchema", () => {
  const schema = incidentSchema(NOW);

  it("combines the SAST date and time into a UTC timestamp", () => {
    expect(schema.parse(valid).occurredAt).toBe("2026-11-19T15:40:00.000Z");
  });

  it("turns witness lines into a clean list", () => {
    expect(schema.parse(valid).witnesses).toEqual(["Nomvula Zulu (Supervisor)", "Sipho Ndlovu"]);
  });

  it.each([
    ["employeeId", "", "Choose the employee involved."],
    ["date", "", "Enter the date it happened."],
    ["time", "25:00", "Enter the time, like 17:40."],
    ["location", " ", "Enter where it happened."],
    ["category", "gossip", "Choose a category."],
    ["description", "Late.", "Describe what happened in at least one full sentence."],
  ])("rejects %s = %j", (field, value, message) => {
    const result = schema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ path: [field], message });
  });

  it("rejects an incident in the future", () => {
    const result = schema.safeParse({ ...valid, date: "2026-11-23", time: "18:30" });
    expect(result.error?.issues[0]).toMatchObject({
      path: ["date"],
      message: "The incident can't be in the future.",
    });
  });

  it("allows an incident earlier today", () => {
    expect(schema.safeParse({ ...valid, date: "2026-11-23", time: "16:55" }).success).toBe(true);
  });
});

describe("parseWitnesses", () => {
  it("allows at most 10 names", () => {
    const many = Array.from({ length: 12 }, (_, i) => `Person ${i}`).join("\n");
    expect(parseWitnesses(many)).toHaveLength(10);
  });
});

describe("evidenceProblem", () => {
  it("accepts photos and PDFs up to 10 MB", () => {
    expect(
      evidenceProblem({ name: "till.pdf", type: "application/pdf", size: 240_000 }),
    ).toBeNull();
    expect(
      evidenceProblem({ name: "a.jpg", type: "image/jpeg", size: 10 * 1024 * 1024 }),
    ).toBeNull();
  });

  it("rejects other file types", () => {
    expect(evidenceProblem({ name: "notes.docx", type: "application/msword", size: 1000 })).toBe(
      "notes.docx: only photos (JPG, PNG, WebP, HEIC) and PDFs can be added.",
    );
  });

  it("rejects files over 10 MB and empty files", () => {
    expect(evidenceProblem({ name: "big.jpg", type: "image/jpeg", size: 11 * 1024 * 1024 })).toBe(
      "big.jpg is larger than 10 MB.",
    );
    expect(evidenceProblem({ name: "empty.pdf", type: "application/pdf", size: 0 })).toBe(
      "empty.pdf is empty.",
    );
  });
});

describe("evidencePath", () => {
  it("puts files in the business's incident folder with a safe name", () => {
    expect(evidencePath("biz", "inc", "abc", "Cash-up sheet (19 Nov).JPG")).toBe(
      "biz/incidents/inc/abc-Cash-up-sheet-19-Nov-.JPG",
    );
  });
});

describe("CATEGORY_LABEL", () => {
  it("has a plain label for every category", () => {
    expect(CATEGORY_LABEL.late_coming).toBe("Late coming");
    expect(Object.keys(CATEGORY_LABEL)).toHaveLength(11);
  });
});
