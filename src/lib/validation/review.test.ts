import { describe, expect, it } from "vitest";
import { commentSchema, reviewSchema } from "./review";

describe("commentSchema", () => {
  it("trims a comment", () => {
    expect(commentSchema.parse({ body: "  Looks fair.  " })).toEqual({ body: "Looks fair." });
  });

  it("rejects an empty comment", () => {
    const result = commentSchema.safeParse({ body: "   " });
    expect(result.error?.issues[0].message).toBe("Write a comment first.");
  });
});

describe("reviewSchema", () => {
  it("approves with or without a comment", () => {
    expect(reviewSchema.parse({ decision: "approve", body: "" })).toEqual({
      decision: "approve",
      body: undefined,
    });
    expect(reviewSchema.parse({ decision: "approve", body: "Well done." }).body).toBe("Well done.");
  });

  it("needs a comment to request changes", () => {
    const result = reviewSchema.safeParse({ decision: "changes", body: " " });
    expect(result.error?.issues[0]).toMatchObject({
      path: ["body"],
      message: "Explain what needs to change, so the owner can fix it.",
    });
  });

  it("rejects unknown decisions", () => {
    expect(reviewSchema.safeParse({ decision: "dismiss", body: "x" }).success).toBe(false);
  });
});
