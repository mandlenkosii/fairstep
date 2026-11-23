import { describe, expect, it } from "vitest";
import { parsePublicEnv, parseServiceRoleKey } from "./env";

describe("parsePublicEnv", () => {
  it("returns the Supabase URL and publishable key", () => {
    expect(
      parsePublicEnv({
        url: "https://abcdefgh.supabase.co",
        anonKey: "sb_publishable_123",
      }),
    ).toEqual({ url: "https://abcdefgh.supabase.co", anonKey: "sb_publishable_123" });
  });

  it("names the missing variable so setup mistakes are easy to fix", () => {
    expect(() => parsePublicEnv({ url: "https://abcdefgh.supabase.co", anonKey: "" })).toThrow(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
    expect(() => parsePublicEnv({ url: undefined, anonKey: "sb_publishable_123" })).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL",
    );
  });

  it("rejects a URL that is not a web address", () => {
    expect(() => parsePublicEnv({ url: "abcdefgh", anonKey: "sb_publishable_123" })).toThrow(
      "NEXT_PUBLIC_SUPABASE_URL",
    );
  });
});

describe("parseServiceRoleKey", () => {
  it("returns the server-only key", () => {
    expect(parseServiceRoleKey("sb_secret_123")).toBe("sb_secret_123");
  });

  it("refuses to run without it", () => {
    expect(() => parseServiceRoleKey(undefined)).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("refuses the publishable key by mistake, because that would silently fail RLS checks", () => {
    expect(() => parseServiceRoleKey("sb_publishable_123")).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });
});
