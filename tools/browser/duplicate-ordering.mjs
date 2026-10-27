/** Actual React/DOM behavior with only the remote Server Action replaced. No app server. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const tooling = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(tooling, "../..");
const output = path.join(tooling, "artifacts", `duplicate-ordering-${randomUUID()}`);
const session = `duplicate-ordering-${randomUUID()}`;
const marker = "DUPLICATE_ORDERING_OK";
await mkdir(output, { recursive: true });

await build({
  configFile: false,
  root,
  envDir: false,
  logLevel: "error",
  plugins: [{
    name: "synthetic-duplicate-server-action",
    enforce: "pre",
    resolveId(source, importer) {
      if (source === "./actions" && importer?.replaceAll("\\", "/").endsWith("/features/specimens/duplicate-request.ts")) {
        return path.join(tooling, "duplicate-ordering/remote-action.ts");
      }
    },
  }],
  resolve: { alias: [
    { find: "@", replacement: path.join(root, "src") },
  ] },
  define: { "process.env": "{}", "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    outDir: output,
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: path.join(tooling, "duplicate-ordering/fixture.tsx"),
      name: "DuplicateOrderingFixture",
      formats: ["iife"],
      fileName: () => "fixture.js",
    },
  },
});

const browserCode = `async page => {
  await page.context().route('**/*', route => route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function mount() {
    await page.goto('about:blank');
    await page.setContent('<main id="root"></main>');
    await page.addScriptTag({ path: ${JSON.stringify(path.join(output, "fixture.js"))} });
  }
  await mount();
  const name = page.getByRole('textbox', { name: 'Common name', exact: true });
  const remarks = page.getByRole('textbox', { name: 'Remarks', exact: true });
  await name.fill('TEST original A');
  await remarks.focus();
  await page.waitForFunction(() => window.duplicateFixture.requests.length === 1);
  await name.fill('TEST edited B');
  await page.evaluate(() => window.duplicateFixture.requests[0].resolve({ status: 'clear' }));
  await page.getByText('Checking for possible duplicates', { exact: false }).waitFor({ state: 'hidden' });
  if (await page.getByText('No possible duplicates were found', { exact: false }).count()) {
    throw new Error('STALE_RESULT: result for A is displayed while the focused input contains B');
  }
  // A later lookup wins even when the earlier lookup completes last.
  await mount();
  await name.fill('TEST original A');
  await remarks.focus();
  await page.waitForFunction(() => window.duplicateFixture.requests.length === 1);
  await name.fill('TEST edited B');
  await remarks.focus();
  await page.waitForFunction(() => window.duplicateFixture.requests.length === 2);
  await page.evaluate(() => window.duplicateFixture.requests[1].resolve({ status: 'unavailable' }));
  await page.evaluate(() => window.duplicateFixture.requests[0].resolve({ status: 'clear' }));
  await page.getByRole('button', { name: 'Check again' }).waitFor();
  if (await page.getByText('No possible duplicates were found', { exact: false }).count()) {
    throw new Error('OUT_OF_ORDER: earlier clear outcome replaced the newer unknown outcome');
  }
  // All three matched fields invalidate settled evidence and still support an explicit retry.
  for (const label of ['Common name', 'Scientific name', 'Accession number']) {
    await mount();
    const field = page.getByRole('textbox', { name: label, exact: true });
    await field.fill('TEST original');
    await remarks.focus();
    await page.waitForFunction(() => window.duplicateFixture.requests.length === 1);
    await page.evaluate(() => window.duplicateFixture.requests[0].resolve({ status: 'clear' }));
    await page.getByText('No possible duplicates were found', { exact: false }).waitFor();
    await field.fill('TEST edited');
    await page.getByText('No possible duplicates were found', { exact: false }).waitFor({ state: 'hidden' });
    await remarks.focus();
    await page.waitForFunction(() => window.duplicateFixture.requests.length === 2);
    await page.evaluate(() => window.duplicateFixture.requests[1].reject(new TypeError('Synthetic failed transport')));
    await page.getByRole('button', { name: 'Check again' }).click();
    await page.waitForFunction(() => window.duplicateFixture.requests.length === 3);
    await page.evaluate(() => {
      const requests = window.duplicateFixture.requests;
      if (JSON.stringify(requests[1].input) !== JSON.stringify(requests[2].input)) {
        throw new Error('Retry changed the candidate');
      }
      requests[2].resolve({ status: 'found', duplicates: [{
        specimenId: '10000000-0000-4000-8000-000000000002',
        accessionNumber: null, scientificName: null, commonName: 'TEST retry hit',
        status: 'UNCATALOGED', confidence: 'MEDIUM', matchedFields: ['COMMON_NAME'],
        differingFields: [], message: 'Synthetic possible duplicate',
      }] });
    });
    await page.getByRole('link', { name: 'TEST retry hit' }).waitFor();
    if (!(await page.getByRole('button', { name: 'Save fixture' }).isEnabled())) {
      throw new Error('Duplicate warning blocked the save control');
    }
    await field.fill('');
    await remarks.focus();
    await page.getByRole('link', { name: 'TEST retry hit' }).waitFor({ state: 'hidden' });
    if (await page.evaluate(() => window.duplicateFixture.requests.length) !== 3) {
      throw new Error('An empty candidate initiated a remote request');
    }
    if (await page.getByText('No possible duplicates were found', { exact: false }).count()) {
      throw new Error('Clearing the candidate claimed no duplicates');
    }
  }
  // An unrelated core field must neither clear evidence nor initiate another lookup.
  await mount();
  await name.fill('TEST unchanged name');
  await remarks.focus();
  await page.waitForFunction(() => window.duplicateFixture.requests.length === 1);
  await page.evaluate(() => window.duplicateFixture.requests[0].resolve({ status: 'clear' }));
  await page.getByText('No possible duplicates were found', { exact: false }).waitFor();
  await remarks.fill('TEST unrelated edit');
  await page.getByRole('button', { name: 'Save fixture' }).focus();
  if (!(await page.getByText('No possible duplicates were found', { exact: false }).isVisible()) ||
      await page.evaluate(() => window.duplicateFixture.requests.length) !== 1) {
    throw new Error('Unrelated edit invalidated unchanged duplicate evidence');
  }
  if (errors.length) throw new Error('Fixture page errors: ' + errors.join('; '));
  return '${marker}: 6 scenarios passed (pending edit, reverse order, three field edit/retry/clear flows, unrelated edit)';
}`;
const script = path.join(output, "check.js");
await writeFile(script, browserCode);

function cli(...args) {
  const result = spawnSync(process.execPath, [path.join(tooling, "cli.mjs"), "--json", `-s=${session}`, ...args], {
    cwd: tooling, encoding: "utf8", shell: false, timeout: 45000, maxBuffer: 1024 * 1024,
  });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const response = JSON.parse(result.stdout);
  assert.notEqual(response.isError, true, JSON.stringify(response));
  return response;
}

let failure;
try {
  cli("open", "about:blank");
  const result = cli("run-code", `--filename=${script}`);
  assert.ok(JSON.stringify(result).includes(marker), "Missing regression success marker");
} catch (error) {
  failure = error;
} finally {
  try { cli("close"); } catch (error) { failure ??= error; }
}
if (failure) {
  console.error(failure.message);
  process.exitCode = 1;
} else {
  console.log(`${marker}: 6 component scenarios passed; isolated session closed.`);
}
