import { describe, expect, it } from "vitest";
import { routeDecision } from "./routes";

describe("routeDecision", () => {
  it("lets everyone see public pages", () => {
    expect(routeDecision("/", null)).toEqual({ type: "next" });
    expect(routeDecision("/", "admin")).toEqual({ type: "next" });
  });

  it("sends signed-out visitors from private areas to log in", () => {
    expect(routeDecision("/app", null)).toEqual({ type: "login" });
    expect(routeDecision("/app/cases/123", null)).toEqual({ type: "login" });
    expect(routeDecision("/consultant", null)).toEqual({ type: "login" });
    expect(routeDecision("/admin/users", null)).toEqual({ type: "login" });
  });

  it("does not treat look-alike paths as private", () => {
    expect(routeDecision("/application", null)).toEqual({ type: "next" });
    expect(routeDecision("/administrator", null)).toEqual({ type: "next" });
  });

  it("lets each role into its own area", () => {
    expect(routeDecision("/app/employees", "business_owner")).toEqual({ type: "next" });
    expect(routeDecision("/consultant", "consultant")).toEqual({ type: "next" });
    expect(routeDecision("/admin/users", "admin")).toEqual({ type: "next" });
  });

  it("sends the wrong role to its own home, on every path in the area", () => {
    expect(routeDecision("/admin/users", "business_owner")).toEqual({ type: "home" });
    expect(routeDecision("/app", "consultant")).toEqual({ type: "home" });
    expect(routeDecision("/consultant/clients", "admin")).toEqual({ type: "home" });
  });

  it("sends signed-in users away from log in and sign up to their home", () => {
    expect(routeDecision("/login", "business_owner")).toEqual({ type: "home" });
    expect(routeDecision("/signup", "consultant")).toEqual({ type: "home" });
    expect(routeDecision("/login", null)).toEqual({ type: "next" });
  });
});
