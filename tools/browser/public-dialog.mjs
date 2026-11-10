/** Real public dialogs, keyboard only; no submissions, app configuration or live endpoint. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import { checkPublicDialogs } from "./public-dialog/check.mjs";

assert.equal(process.argv.length, 2, "No application targets accepted");
const tooling = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(tooling, "../..");
const output = path.join(tooling, "artifacts", `public-dialog-${randomUUID()}`);
const session = `public-dialog-${randomUUID()}`;
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
    "process.env.NEXT_PUBLIC_SUPABASE_URL": JSON.stringify(
      "https://auth.example.test",
    ),
    "process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY": JSON.stringify(
      "synthetic-public-key",
    ),
    "process.env.NEXT_PUBLIC_API_URL": JSON.stringify(
      "http://public-dialog-fixture.test",
    ),
    "process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES": JSON.stringify("30"),
  },
  build: {
    outDir: output,
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: path.join(tooling, "public-dialog/fixture.tsx"),
      name: "PublicDialogFixture",
      formats: ["iife"],
      fileName: () => "fixture.js",
    },
  },
});
const script = path.join(output, "check.js");
await writeFile(
  script,
  `async page => (${checkPublicDialogs.toString()})(page,${JSON.stringify(path.join(output, "fixture.js"))})`,
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
      timeout: 180000,
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
  const result = JSON.parse(cli("run-code", `--filename=${script}`).result);
  assert.equal(result.marker, "PUBLIC_DIALOG_OK");
  assert.equal(result.scenarios, 6);
  assert.equal(result.nonReadRequests, 0);
  assert.equal(result.unexpectedRequests, 0);
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
} else console.log("PUBLIC_DIALOG_OK: 6 scenarios passed; own session closed.");
