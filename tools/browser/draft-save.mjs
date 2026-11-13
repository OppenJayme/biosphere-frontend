/** Actual core form, CSS and pointer events; remote actions are synthetic and all network is blocked. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { readFile } from "node:fs/promises";
import { checkDraftSave } from "./draft-save/check.mjs";

assert.equal(process.argv.length, 2, "No application targets accepted");
const tooling = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(tooling, "../..");
const output = path.join(
  tooling,
  "artifacts",
  `draft-save-${randomUUID()}`,
);
const session = `draft-save-${randomUUID()}`;
await mkdir(output, { recursive: true });
await build({
  configFile: false,
  plugins: [{
    name: "synthetic-core-actions",
    enforce: "pre",
    resolveId(source, importer) {
      if (/\/features\/specimens\/actions(?:\.ts)?$/.test(source.replaceAll("\\", "/")) ||
        (source === "./actions" && importer?.replaceAll("\\", "/").endsWith("/features/specimens/duplicate-request.ts"))) {
        return path.join(tooling, "draft-save/remote-actions.ts");
      }
    },
  }],
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
      "http://public-submissions-fixture.test",
    ),
    "process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES": JSON.stringify("30"),
  },
  build: {
    outDir: output,
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: path.join(tooling, "draft-save/fixture.tsx"),
      name: "DraftSaveFixture",
      formats: ["iife"],
      fileName: () => "fixture.js",
    },
  },
});
const cssSource=path.join(root,"src/app/globals.css");
const css=await postcss([tailwind()]).process((await readFile(cssSource,"utf8")).replace('@import "tailwindcss";','@import "tailwindcss" source(none);\n@source "../../src";'),{from:cssSource});
await writeFile(path.join(output,"fixture.css"),css.css);
const script = path.join(output, "check.js");
await writeFile(
  script,
  `async page => (${checkDraftSave.toString()})(page,${JSON.stringify(path.join(output, "fixture.js"))},${JSON.stringify(path.join(output,"fixture.css"))})`,
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
  assert.equal(result.marker, "DRAFT_SAVE_LAYOUT_OK");
  assert.equal(result.scenarios, 10);
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
} else
  console.log(
    "DRAFT_SAVE_LAYOUT_OK: 10 scenarios passed; own session closed.",
  );
