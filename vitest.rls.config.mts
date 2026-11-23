import { defineConfig } from "vitest/config";

// Database security tests. They need a running Supabase (local in CI).
// Run with: npm run test:rls
export default defineConfig({
  test: {
    environment: "node",
    include: ["supabase/tests/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
