/** Investigate tab-route teardown only against a fresh in-memory loopback canary. */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { startCanaryServer } from "./isolation-server.mjs";

if (process.argv.length !== 2) throw new Error("Canary check accepts no target URLs or other arguments");

const execute = promisify(execFile);
const directory = fileURLToPath(new URL("./", import.meta.url));
const cli = fileURLToPath(new URL("./cli.mjs", import.meta.url));
const session = `biosphere-canary-${randomUUID()}`;

// Async child execution keeps this process available to serve the canary HTTP requests.
async function run(...args) {
  const { stdout } = await execute(process.execPath, [cli, "--json", `-s=${session}`, ...args], {
    cwd: directory, timeout: 45000, maxBuffer: 1024 * 1024, windowsHide: true,
  });
  const response = JSON.parse(stdout);
  assert.notEqual(response.isError, true, "CLI returned a structured error");
  return response;
}

const canary = await startCanaryServer();
let failure;
try {
  await run("open", "about:blank");
  await assert.rejects(
    run("run-code", "async () => {throw new Error('EXPECTED_CANARY_FAILURE');}"),
    error => error.code === 1 && (error.stdout ?? "").includes("EXPECTED_CANARY_FAILURE"),
    "An intentional browser assertion must propagate as a failed command",
  );
  // Never accept a user URL, saved profile or application credentials.
  const origin = JSON.stringify(canary.origin);
  await run("run-code", `async page => {
    await page.context().route('**/*', route => {
      if (new URL(route.request().url()).origin === ${origin}) return route.continue();
      return route.abort();
    });
    await page.goto(${origin});
    const status = await page.evaluate(async () => (await fetch('/canary/control', {method:'POST',body:'synthetic',credentials:'omit'})).status);
    if (status !== 204) throw new Error('Canary positive control failed');
    return {positiveControl:true};
  }`);
  const counts = await (await fetch(`${canary.origin}/counts`, {signal:AbortSignal.timeout(5000)})).json();
  assert.equal(counts.control, 1, "A real fixture arrival must be detected");
  // Prove a false no-write claim is rejected by the independent server-side counter.
  assert.throws(() => assert.equal(counts.control, 0), {name:"AssertionError"});
  await run("run-code", `async page => {
    const context = page.context();
    // Intentionally reproduce the old held-handler lifecycle, but only on the canary.
    async function closeHeld(path, offlineBeforeClose) {
      const target = await context.newPage();
      let release;
      let markSeen;
      let markDone;
      const seen = new Promise(resolve => {markSeen = resolve;});
      const done = new Promise(resolve => {markDone = resolve;});
      try {
        await target.goto(${origin});
        await target.route('**/canary/' + path, async route => {
          const held = new Promise(resolve => {release = resolve;});
          markSeen();
          await held;
          try { await route.abort(); } catch { /* Closed-target failure is observed by server counts. */ }
          finally {markDone();}
        });
        await target.evaluate(path => {void fetch('/canary/' + path, {method:'POST',body:'synthetic',credentials:'omit'}).catch(() => {});}, path);
        await seen;
        if (offlineBeforeClose) await context.setOffline(true);
        await target.close();
        release();
        await done;
      } finally {
        if (release) release();
        if (!target.isClosed()) await target.close();
        if (offlineBeforeClose) await context.setOffline(false);
      }
    }
    await closeHeld('held', false);
    // Abort while the target still exists, and wait for fetch rejection before closing.
    const aborted = await context.newPage();
    try {
      await aborted.goto(${origin});
      await aborted.route('**/canary/aborted', route => route.abort());
      const result = await aborted.evaluate(() => fetch('/canary/aborted', {method:'POST',body:'synthetic',credentials:'omit'}).then(() => 'unexpected-response', () => 'aborted'));
      if (result !== 'aborted') throw new Error('Abort-before-close did not reject fetch');
    } finally {await aborted.close();}
    await closeHeld('offline', true);
    return {tabCloseProbesCompleted:true};
  }`);
  // Bounded observation window: delayed arrivals must also be counted, not just the first read.
  const snapshots = [];
  for (let sample = 0; sample < 5; sample++) {
    await new Promise(resolve => setTimeout(resolve, 200));
    snapshots.push(await (await fetch(`${canary.origin}/counts`, {signal:AbortSignal.timeout(5000)})).json());
  }
  for (const observed of snapshots) {
    assert.equal(observed.control, 1);
    assert.ok([0, 1].includes(observed.held), "Unexpected repeated held-request arrival");
    assert.equal(observed.aborted, 0, "Abort-before-close request reached the canary");
    assert.equal(observed.offline, 0, "Offline-before-close request reached the canary");
  }
  console.log(JSON.stringify({
    positiveControlArrivals:counts.control, falseNoWriteClaimRejected:true,
    intentionalBrowserFailureDetected:true,
    canaryArrivals:snapshots.at(-1), observationWindowMs:1000,
    heldCloseLeakObserved:snapshots.some(item => item.held > 0),
  }));
} catch (error) {
  failure = error;
} finally {
  try { await run("close"); } catch (error) { failure ??= error; }
  try { await canary.close(); } catch (error) { failure ??= error; }
}
if (failure) {
  console.error(`Canary check failed: ${failure.message}`);
  process.exitCode = 1;
}
