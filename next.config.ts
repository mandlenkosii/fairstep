import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off on purpose: almost every FairStep page reads the
  // signed-in user's session, so pages render per request (classic dynamic
  // rendering). See node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
