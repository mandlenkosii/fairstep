import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./errors";

describe("authErrorMessage", () => {
  it("explains a wrong email or password without saying which one", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe(
      "That email and password don't match. Check them and try again.",
    );
  });

  it("points existing users to log in", () => {
    expect(authErrorMessage({ code: "user_already_exists" })).toBe(
      "There's already an account with this email. Log in instead.",
    );
    expect(authErrorMessage({ code: "email_exists" })).toBe(
      "There's already an account with this email. Log in instead.",
    );
  });

  it("asks people to slow down when rate-limited", () => {
    expect(authErrorMessage({ code: "over_request_rate_limit" })).toBe(
      "Too many attempts. Wait a minute, then try again.",
    );
  });

  it("explains a weak password", () => {
    expect(authErrorMessage({ code: "weak_password" })).toBe(
      "Choose a stronger password: at least 8 characters, not a common one.",
    );
  });

  it("never shows raw technical errors", () => {
    expect(authErrorMessage({ code: "unexpected_failure", message: "pg: relation x" })).toBe(
      "Something went wrong on our side. Please try again.",
    );
    expect(authErrorMessage({})).toBe("Something went wrong on our side. Please try again.");
  });
});
