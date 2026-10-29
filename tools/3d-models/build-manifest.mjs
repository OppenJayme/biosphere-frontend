#!/usr/bin/env node
// Builds a `tripo batch run` manifest from the specimen photo folders.
//
//   3d-models/photos/<ACCESSION>_<slug>/front.jpg back.jpg left.jpg right.jpg
//                                      extra/...   (reference shots, ignored here)
//
// One folder = one job. The four main views go to Tripo as a multiview
// generation (front is required; back/left/right are optional). Everything in
// `extra/` stays local for the curator and for fixing models later.
//
// Usage (from the repo root):
//   node tools/3d-models/build-manifest.mjs [--photos <dir>] [--manifest <file>] [--only a,b]
//
// No credits are spent here. The cost estimate comes from `tripo make --dry-run`,
// which never uploads or submits anything.

import { existsSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative, extname } from "node:path";
import { spawnSync } from "node:child_process";

const VIEWS = ["front", "back", "left", "right"];
const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"]);
const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // Tripo upload limit per image
// The ar-web preset: P2 model, 20k-face GLB for the web viewer + USDZ for iOS AR.
const SCENARIO = "ar-web";

function parseArgs(argv) {
  const args = { photos: "3d-models/photos", manifest: "3d-models/tripo-batch.yaml", only: null };
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = argv[i + 1];
    if (flag === "--photos") {
      args.photos = value;
      i++;
    } else if (flag === "--manifest") {
      args.manifest = value;
      i++;
    } else if (flag === "--only") {
      args.only = value.split(",").map((s) => s.trim().toLowerCase());
      i++;
    } else if (flag === "--help" || flag === "-h") {
      console.log("node tools/3d-models/build-manifest.mjs [--photos <dir>] [--manifest <file>] [--only a,b]");
      process.exit(0);
    } else {
      console.error(`Unknown option: ${flag}`);
      process.exit(2);
    }
  }
  return args;
}

const toPosix = (p) => p.split("\\").join("/");

// Picks the file for each view by name, so `front.jpg`, `Front_01.JPG` and
// `turtle-front.png` all count. Returns { views, problems }.
function readSpecimenFolder(dir) {
  const problems = [];
  const views = {};
  for (const file of readdirSync(dir)) {
    const full = join(dir, file);
    if (!statSync(full).isFile()) continue;
    const ext = extname(file).toLowerCase();
    if (ext === ".heic" || ext === ".heif") {
      problems.push(`${file}: HEIC is not accepted by Tripo. Re-export as JPEG (iPhone: Settings > Camera > Formats > Most Compatible).`);
      continue;
    }
    if (!IMAGE_EXTS.has(ext)) continue;
    const view = VIEWS.find((v) => file.toLowerCase().includes(v));
    if (!view) continue;
    if (views[view]) {
      problems.push(`${file}: more than one "${view}" photo; using ${views[view].file}. Move the spare into extra/.`);
      continue;
    }
    if (statSync(full).size > MAX_IMAGE_BYTES) {
      problems.push(`${file}: larger than 20 MB, Tripo will reject it. Export a smaller JPEG.`);
      continue;
    }
    views[view] = { file, path: full };
  }
  if (!views.front) problems.push('no "front" photo, which Tripo requires. This specimen is skipped.');
  return { views, problems };
}

function runTripoDryRun(inputs) {
  const args = ["make", ...inputs, "--for", SCENARIO, "--dry-run", "--json"];
  // tripo is a .cmd shim on Windows, which needs a shell; quote paths for it.
  const isWin = process.platform === "win32";
  const result = spawnSync("tripo", isWin ? args.map((a) => `"${a}"`) : args, {
    encoding: "utf8",
    shell: isWin,
  });
  if (result.error || result.stdout === "") return null;
  try {
    return JSON.parse(result.stdout.trim().split("\n").pop());
  } catch {
    return null;
  }
}

const args = parseArgs(process.argv.slice(2));

if (!existsSync(args.photos)) {
  console.error(`Photo folder not found: ${args.photos}`);
  console.error("Create it and add one folder per specimen, e.g. 3d-models/photos/USCBM-REP-2025-002_green-sea-turtle/");
  process.exit(1);
}

const folders = readdirSync(args.photos)
  .filter((name) => statSync(join(args.photos, name)).isDirectory())
  .filter((name) => !args.only || args.only.some((o) => name.toLowerCase().includes(o)))
  .sort();

if (folders.length === 0) {
  console.error(`No specimen folders in ${args.photos}${args.only ? " matching --only" : ""}.`);
  process.exit(1);
}

const manifestDir = dirname(args.manifest);
const modelsDir = toPosix(join(manifestDir, "models"));
const jobs = [];
let warnings = 0;

for (const folder of folders) {
  const { views, problems } = readSpecimenFolder(join(args.photos, folder));
  const found = VIEWS.filter((v) => views[v]);
  console.log(`\n${folder}`);
  console.log(`  views: ${found.length ? found.join(", ") : "none"}${found.length === 1 ? "  (single photo: back/sides will be guessed)" : ""}`);
  for (const p of problems) {
    console.log(`  ! ${p}`);
    warnings++;
  }
  if (!views.front) continue;

  const name = folder.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  // Paths are relative to the repo root, where `tripo batch run` is started.
  jobs.push({
    name,
    inputs: found.map((v) => toPosix(relative(process.cwd(), views[v].path))),
    out: `${modelsDir}/${name}`,
  });
}

if (jobs.length === 0) {
  console.error("\nNo specimen has a front photo, so there is nothing to generate.");
  process.exit(1);
}

const yaml = [
  "# Generated by tools/3d-models/build-manifest.mjs. Re-run that script instead of editing by hand.",
  "# Run from the repo root:  tripo batch run 3d-models/tripo-batch.yaml",
  "concurrency: 2",
  "defaults:",
  `  for: ${SCENARIO}`,
  "jobs:",
  ...jobs.flatMap((job) => [
    `  - name: ${JSON.stringify(job.name)}`,
    `    inputs: [${job.inputs.map((i) => JSON.stringify(i)).join(", ")}]`,
    `    out: ${JSON.stringify(job.out)}`,
  ]),
  "",
].join("\n");

mkdirSync(manifestDir, { recursive: true });
writeFileSync(args.manifest, yaml);

console.log(`\nWrote ${args.manifest} with ${jobs.length} job(s)${warnings ? `, ${warnings} warning(s) above` : ""}.`);

// Cost estimate: dry-run the first job (all jobs share the same preset).
const plan = runTripoDryRun(jobs[0].inputs);
if (!plan) {
  console.log("Could not run `tripo make --dry-run` for a cost estimate. Is the Tripo CLI installed? (npm install -g tripo-cli)");
} else if (!plan.valid) {
  console.log(`Tripo rejected the plan for ${jobs[0].name}:\n  ${plan.errors.join("\n  ")}`);
  process.exit(1);
} else {
  const each = plan.generation_credits_estimate;
  console.log(
    each == null
      ? "Tripo did not estimate the credit cost for this preset."
      : `Estimated cost: about ${each} credits per specimen x ${jobs.length} = ${each * jobs.length} credits (generation only; the USDZ conversion adds a little).`,
  );
}
console.log("Check your balance with `tripo balance` before starting the batch.");
console.log("Tip: run one specimen first with --only <name> to confirm quality before spending on all of them.");
