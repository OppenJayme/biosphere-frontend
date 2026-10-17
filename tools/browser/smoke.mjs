/** Exercise only an in-memory fixture through the real CLI, never BioSphere or its accounts. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const toolingDirectory = path.dirname(fileURLToPath(import.meta.url));
const session = `biosphere-smoke-${randomUUID()}`;
const marker = "BIOSPHERE_BROWSER_SMOKE_OK";

function run(...args) {
  const result = spawnSync(process.execPath, [
    path.join(toolingDirectory, "cli.mjs"), "--json", `-s=${session}`, ...args,
  ], {
    cwd: toolingDirectory,
    encoding: "utf8",
    shell: false,
    timeout: 45000,
    maxBuffer: 1024 * 1024,
  });
  if (result.error) throw result.error;
  return result;
}

function requireSuccess(result) {
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const response = JSON.parse(result.stdout);
  assert.notEqual(response.isError, true, "CLI returned a structured error");
  return response;
}

let failure;
try {
  requireSuccess(run("open", "about:blank"));
  // Verify the harness can go red rather than treating every CLI response as success.
  const negative = run("run-code", "async () => { throw new Error('EXPECTED_SMOKE_FAILURE'); }");
  assert.notEqual(negative.status, 0, "An intentional browser assertion must fail");
  assert.match(negative.stdout + negative.stderr, /EXPECTED_SMOKE_FAILURE/);

  const response = requireSuccess(run("run-code", `async page => {
    await page.context().route('**/*', route => route.abort());
    await page.setContent('<label>Name<input aria-label="Name"></label><button>Save fixture</button><output></output>');
    await page.evaluate(() => document.querySelector('button').addEventListener('click', () => {
      document.querySelector('output').textContent = 'Fixture saved';
    }));
    await page.getByRole('textbox', { name: 'Name' }).fill('Museum test');
    await page.getByRole('button', { name: 'Save fixture' }).click();
    if (await page.locator('output').textContent() !== 'Fixture saved') throw new Error('Fixture button did not work');
    if (await page.getByRole('textbox', { name: 'Name' }).inputValue() !== 'Museum test') throw new Error('Fixture input did not persist');
    return '${marker}';
  }`));
  assert.ok(JSON.stringify(response).includes(marker), "Missing browser success marker");
} catch (error) {
  failure = error;
} finally {
  // Close only this unique smoke session; never close-all or touch a personal browser.
  try {
    requireSuccess(run("close"));
  } catch (error) {
    failure ??= error;
  }
}

if (failure) {
  console.error(`Browser smoke failed: ${failure.message}`);
  process.exitCode = 1;
} else {
  console.log(`${marker}: input/click checks passed, intentional failure detected, session closed.`);
}
