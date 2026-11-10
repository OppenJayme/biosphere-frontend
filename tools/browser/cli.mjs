/** Run the pinned local CLI without inheriting application secrets or auto-update checks. */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolingDirectory = path.dirname(fileURLToPath(import.meta.url));

// Keep OS/browser essentials only; never load .env files or forward arbitrary
// credentials, NODE_OPTIONS, proxy credentials or npm configuration to the tool.
const runtimeNames = new Set([
  "path", "systemroot", "windir", "comspec", "pathext", "temp", "tmp",
  "tmpdir", "userprofile", "localappdata", "appdata", "programfiles",
  "programfiles(x86)", "programdata", "lang", "lc_all", "display",
  "wayland_display", "xdg_runtime_dir",
]);
const runtimeEnv = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => runtimeNames.has(name.toLowerCase())),
);
runtimeEnv.NO_UPDATE_NOTIFIER = "1";

const packageDirectory = path.dirname(fileURLToPath(import.meta.resolve("@playwright/cli/package.json")));
const args = process.argv.slice(2);
// Config is an open option, not a global flag; close/run-code use the session's config.
if (args.find((arg) => !arg.startsWith("-")) === "open") {
  args.push(`--config=${path.join(toolingDirectory, "cli.config.json")}`);
}
const result = spawnSync(process.execPath, [path.join(packageDirectory, "playwright-cli.js"), ...args], {
  cwd: toolingDirectory,
  env: runtimeEnv,
  shell: false,
  stdio: "inherit",
});

if (result.error) console.error(`Browser CLI could not start: ${result.error.message}`);
process.exitCode = result.status ?? 1;
