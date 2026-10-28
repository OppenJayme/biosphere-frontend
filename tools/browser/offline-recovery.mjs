/** Opt-in owned lost-response fixture. Never accepts an application URL argument. */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { build } from "vite";
import { checkRecovery } from "./offline-recovery/check.mjs";

assert.equal(process.argv.length, 2, "No target arguments accepted");
assert.equal(process.env.RUN_OFFLINE_RECOVERY, "true", "Use the backend owned recovery command");
let input = "";
for await (const chunk of process.stdin) {
  input += chunk;
  assert.ok(input.length < 1024, "Oversized fixture descriptor");
}
const descriptor = JSON.parse(input);
assert.deepEqual(Object.keys(descriptor), ["origin"]);
const target = new URL(descriptor.origin);
assert.equal(target.protocol, "http:");
assert.equal(target.hostname, "127.0.0.1");
assert.ok(target.port && !["3000", "3001", "3002"].includes(target.port));
assert.equal(target.href, `${target.origin}/`);
const tooling = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(tooling, "../..");
const output = path.join(tooling, "artifacts", `offline-recovery-${randomUUID()}`);
const session = `offline-recovery-${randomUUID()}`;
await mkdir(output, { recursive: true });
await build({
  configFile: false, root, envDir: false, publicDir: false, logLevel: "error",
  resolve: { alias: [{ find: "@", replacement: path.join(root, "src") }] },
  define: { "process.env": "{}", "process.env.NODE_ENV": JSON.stringify("production") },
  build: { outDir: output, emptyOutDir: false, minify: false,
    lib: { entry: path.join(tooling, "offline-containment/fixture.tsx"),
      name: "OfflineRecoveryFixture", formats: ["iife"], fileName: () => "fixture.js" } },
});
const execute = promisify(execFile);
async function cli(...args) {
  let stdout;
  try {
    ({ stdout } = await execute(process.execPath, [path.join(tooling, "cli.mjs"), "--json", `-s=${session}`, ...args], {
      cwd: tooling, windowsHide: true, timeout: 45000, maxBuffer: 1024 * 1024,
    }));
  } catch (error) {
    // This context contains only fixture data. Preserve the failed browser assertion, not just its command.
    throw new Error(`Owned browser command failed: ${error.stdout?.slice(-6000) || error.message}`);
  }
  const result = JSON.parse(stdout);
  assert.notEqual(result.isError, true, "Recovery browser assertion failed");
  return result;
}
let failure;
try {
  const script = path.join(output, "check.js");
  await writeFile(script, `async page => (${checkRecovery.toString()})(page, ${JSON.stringify({
    origin: target.origin, bundle: path.join(output, "fixture.js"),
  })})`);
  await cli("open", "about:blank");
  const result = await cli("run-code", `--filename=${script}`);
  assert.ok(JSON.stringify(result).includes("OFFLINE_RECOVERY_OK"), "Missing recovery marker");
} catch (error) { failure = error; }
finally { try { await cli("close"); } catch (error) { failure ??= error; } }
if (failure) {
  console.error(`Owned recovery failed: ${failure.message}`);
  process.exitCode = 1;
} else console.log("OFFLINE_RECOVERY_OK: interrupted tab recovered the same draft/specimen; own session closed.");
