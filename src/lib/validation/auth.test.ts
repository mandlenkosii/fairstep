import { describe, expect, it } from "vitest";
import { fieldErrors, loginSchema, signupSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts an email and password, trimming and lower-casing the email", () => {
    const result = loginSchema.safeParse({ email: "  Thabo@KasiKitchen.co.za ", password: "x" });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe("thabo@kasikitchen.co.za");
  });

  it("explains what's wrong in plain language", () => {
    const result = loginSchema.safeParse({ email: "thabo", password: "" });
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!)).toEqual({
      email: "Enter a valid email address, like name@business.co.za.",
      password: "Enter your password.",
    });
  });
});

describe("signupSchema", () => {
  const valid = {
    fullName: "Thabo Mokoena",
    businessName: "Kasi Kitchen",
    email: "thabo@kasikitchen.co.za",
    password: "fair-steps-2026",
  };

  it("accepts a complete sign-up", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("needs a password of at least 8 characters", () => {
    const result = signupSchema.safeParse({ ...valid, password: "short" });
    expect(fieldErrors(result.error!)).toEqual({
      password: "Use at least 8 characters.",
    });
  });

  it("needs a name and a business name", () => {
    const result = signupSchema.safeParse({ ...valid, fullName: " ", businessName: "" });
    expect(fieldErrors(result.error!)).toEqual({
      fullName: "Enter your name.",
      businessName: "Enter your business name.",
    });
  });
});
