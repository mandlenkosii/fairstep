import { describe, expect, it } from "vitest";
import { homeFor, isRole, ROLE_LABEL } from "./roles";

describe("homeFor", () => {
  it("sends each role to its own area", () => {
    expect(homeFor("business_owner")).toBe("/app");
    expect(homeFor("consultant")).toBe("/consultant");
    expect(homeFor("admin")).toBe("/admin");
  });
});

describe("isRole", () => {
  it("accepts the three platform roles only", () => {
    expect(isRole("business_owner")).toBe(true);
    expect(isRole("consultant")).toBe(true);
    expect(isRole("admin")).toBe(true);
    expect(isRole("owner")).toBe(false);
    expect(isRole(null)).toBe(false);
  });
});

describe("ROLE_LABEL", () => {
  it("names roles in plain words", () => {
    expect(ROLE_LABEL.consultant).toBe("Labour consultant");
  });
});
