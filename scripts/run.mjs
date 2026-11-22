// Runs a dev tool (next, vitest) from a working directory with an uppercase
// Windows drive letter. VS Code terminals open at "c:\...", and with a lowercase
// drive letter Node loads some modules twice under different paths:
// - Vitest fails with "Vitest failed to find the current suite"
// - Next.js dev returns 500 because Tailwind's Turbopack loader "cannot be found"
// On macOS, Linux and CI the path is unchanged.
//
// Usage: node scripts/run.mjs <command> [args...]   e.g. node scripts/run.mjs next dev
import { spawnSync } from "node:child_process";

const [command, ...args] = process.argv.slice(2);
const cwd = process.cwd().replace(/^[a-z]:/, (drive) => drive.toUpperCase());

const { status } = spawnSync("npx", ["--no-install", command, ...args], {
  cwd,
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(status ?? 1);
