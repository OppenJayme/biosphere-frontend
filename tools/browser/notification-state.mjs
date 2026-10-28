/** Real bell with synthetic HTTP, fresh isolated Edge and no live application. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { checkBell } from "./notification-state/check.mjs";
assert.equal(process.argv.length, 2, "No application targets accepted");
const tooling = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(tooling, "../..");
const output = path.join(
  tooling,
  "artifacts",
  `notification-state-${randomUUID()}`,
);
const session = `notification-state-${randomUUID()}`;
await mkdir(output, { recursive: true });
await build({
  configFile: false,
  envDir: false,
  publicDir: false,
  root,
  logLevel: "error",
  resolve: { alias: [{ find: "@", replacement: path.join(root, "src") }] },
  define: {
    "process.env": "{}",
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: output,
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: path.join(tooling, "notification-state/fixture.tsx"),
      name: "NotificationFixture",
      formats: ["iife"],
      fileName: () => "fixture.js",
    },
  },
});
const script = path.join(output, "check.js");
await writeFile(
  script,
  `async page => (${checkBell.toString()})(page,${JSON.stringify(path.join(output, "fixture.js"))})`,
);
function cli(...args) {
  const result = spawnSync(
    process.execPath,
    [path.join(tooling, "cli.mjs"), "--json", `-s=${session}`, ...args],
    {
      cwd: tooling,
      encoding: "utf8",
      shell: false,
      windowsHide: true,
      timeout: 45000,
      maxBuffer: 1024 * 1024,
    },
  );
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stdout || result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.notEqual(parsed.isError, true, JSON.stringify(parsed));
  return parsed;
}
let failure;
try {
  cli("open", "about:blank");
  assert.ok(
    JSON.stringify(cli("run-code", `--filename=${script}`)).includes(
      "NOTIFICATION_BELL_OK",
    ),
  );
} catch (error) {
  failure = error;
} finally {
  try {
    cli("close");
  } catch (error) {
    failure ??= error;
  }
}
if (failure) {
  console.error(failure.message);
  process.exitCode = 1;
} else console.log("NOTIFICATION_BELL_OK: own session closed.");
