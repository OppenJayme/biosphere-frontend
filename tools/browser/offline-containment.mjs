/** Called by the owned backend preflight, not against an environment-supplied application. */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { build } from "vite";
import { startCanaryServer } from "./isolation-server.mjs";

assert.equal(process.argv.length, 2, "No target arguments are accepted");
assert.equal(process.env.RUN_OFFLINE_CONTAINMENT, "true", "Use the backend owned-fixture command");
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
assert.equal(target.href, `${target.origin}/`, "Only an ephemeral fixture origin is accepted");

const tooling = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(tooling, "../..");
const output = path.join(tooling, "artifacts", `offline-containment-${randomUUID()}`);
const session = `offline-containment-${randomUUID()}`;
const marker = "OFFLINE_CONTAINMENT_OK";
await mkdir(output, { recursive: true });
await build({
  configFile: false, root, envDir: false, logLevel: "error",
  resolve: { alias: [{ find: "@", replacement: path.join(root, "src") }] },
  define: { "process.env": "{}", "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: output, emptyOutDir: false, minify: false,
    lib: { entry: path.join(tooling, "offline-containment/fixture.tsx"),
      name: "OfflineContainmentFixture", formats: ["iife"], fileName: () => "fixture.js" },
  },
});

const execute = promisify(execFile);
async function cli(...args) {
  const { stdout } = await execute(process.execPath, [path.join(tooling, "cli.mjs"),
    "--json", `-s=${session}`, ...args], {
    cwd: tooling, timeout: 45000, maxBuffer: 1024 * 1024, windowsHide: true,
  });
  const result = JSON.parse(stdout);
  assert.notEqual(result.isError, true, "Browser assertion failed");
  return result;
}

const canary = await startCanaryServer();
let failure;
try {
  const script = path.join(output, "check.js");
  await writeFile(script, `async page => {
    const origin = ${JSON.stringify(target.origin)};
    const canary = ${JSON.stringify(canary.origin)};
    const context = page.context();
    if ((await context.cookies()).length || context.serviceWorkers().length) {
      throw new Error('Fixture context was not empty');
    }
    let blocked = 0;
    const errors = [];
    context.on('page', tab => tab.on('pageerror', error => errors.push(error.message)));
    page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', route => {
      const request = route.request();
      const url = new URL(request.url());
      const allowedFixtureRead = url.origin === origin && request.method() === 'GET' &&
        ['/', '/api/offline/specimens', '/fixture/backend-check'].includes(url.pathname) && !url.search;
      const allowedCanary = url.origin === canary && !url.search &&
        ((request.method() === 'GET' && url.pathname === '/') ||
         (request.method() === 'POST' && url.pathname === '/canary/control'));
      if (allowedFixtureRead || allowedCanary) return route.continue();
      blocked++;
      return route.abort();
    });
    await page.goto(origin);
    if ((await page.evaluate(() => indexedDB.databases())).length) {
      throw new Error('Fixture origin contained existing IndexedDB data');
    }
    await page.addScriptTag({ path: ${JSON.stringify(path.join(output, "fixture.js"))} });
    await page.getByRole('heading', { name: 'Offline specimen workspace' }).waitFor();
    const workspaceToggle = page.getByRole('button', { name: 'Offline specimen workspace', exact:true });
    if (await workspaceToggle.getAttribute('aria-expanded') === 'false') {
      await workspaceToggle.click();
    }
    await page.getByText('No offline drafts on this device.', {exact:true}).waitFor();
    await page.getByRole('button', { name: 'New offline draft', exact:true }).click();
    await page.getByRole('heading', { name:'New offline specimen draft' }).waitFor();
    await page.getByRole('button', { name:'Cancel', exact:true }).click();
    const ready = await page.evaluate(async () => {
      const response = await fetch('/fixture/backend-check', {credentials:'omit'});
      return response.ok && (await response.json()).ready;
    });
    if (!ready) throw new Error('Owned Nest read positive control failed');
    const blockedDraft = await page.evaluate(() => fetch('/api/offline/specimen-drafts', {
      method:'POST', credentials:'omit', body:'{}'
    }).then(() => false, () => true));
    if (!blockedDraft) throw new Error('Browser write guard failed');
    const probe = await context.newPage();
    try {
      await probe.goto(canary);
      const positive = await probe.evaluate(async () => (await fetch('/canary/control', {
        method:'POST', credentials:'omit', body:'synthetic'
      })).status);
      if (positive !== 204) throw new Error('Independent canary positive control failed');
      const denied = await probe.evaluate(() => fetch('/canary/aborted', {
        method:'POST', credentials:'omit', body:'synthetic'
      }).then(() => false, () => true));
      if (!denied) throw new Error('Denied canary request unexpectedly completed');
    } finally { await probe.close(); }
    if (blocked !== 2 || errors.length) throw new Error('Unexpected blocked request count or page error');
    if (context.serviceWorkers().length) throw new Error('Unexpected service worker');
    await page.getByText('No offline drafts on this device.', {exact:true}).waitFor();
    return '${marker}';
  }`);
  await cli("open", "about:blank");
  const result = await cli("run-code", `--filename=${script}`);
  assert.ok(JSON.stringify(result).includes(marker), "Missing browser success marker");
  // Observe server arrivals independently of the browser page's lifetime.
  for (let sample = 0; sample < 5; sample++) {
    await new Promise(resolve => setTimeout(resolve, 200));
    const counts = await (await fetch(`${canary.origin}/counts`, {
      signal: AbortSignal.timeout(5000),
    })).json();
    assert.deepEqual(counts, { control: 1, held: 0, aborted: 0, offline: 0 });
    assert.throws(() => assert.equal(counts.control, 0), { name: "AssertionError" });
  }
} catch (error) { failure = error; }
finally {
  try { await cli("close"); } catch (error) { failure ??= error; }
  try { await canary.close(); } catch (error) { failure ??= error; }
}
if (failure) {
  console.error(`Offline containment failed: ${failure.message}`);
  process.exitCode = 1;
} else console.log(`${marker}: real panel, owned backend read, two blocked requests, independent canary; session closed.`);
