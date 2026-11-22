// Starts Vitest with an uppercase Windows drive letter in the working directory.
// A terminal opened at "c:\..." makes Vitest load itself twice and fail with
// "Vitest failed to find the current suite". On macOS/Linux this changes nothing.
import { spawnSync } from "node:child_process";

const cwd = process.cwd().replace(/^[a-z]:/, (drive) => drive.toUpperCase());
const { status } = spawnSync("npx", ["vitest", ...process.argv.slice(2)], {
  cwd,
  stdio: "inherit",
  shell: process.platform === "win32",
});
process.exit(status ?? 1);
