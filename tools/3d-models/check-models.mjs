#!/usr/bin/env node
// Technical check for generated 3D models before they are uploaded through the
// developer AR Asset Deployment page. Reads GLB files directly (no dependencies)
// and reports file size, triangle count, texture sizes and animation clips.
//
// Usage (from the repo root):
//   node tools/3d-models/check-models.mjs                 # every model under 3d-models/models
//   node tools/3d-models/check-models.mjs path/to/a.glb   # specific files or folders
//   node tools/3d-models/check-models.mjs --validate      # also run the Khronos glTF validator (via npx)
//
// Writes a summary to 3d-models/check-report.md and exits 1 if any model fails.
// Passing this check is not approval: the model still needs the visual review,
// the phone test and the curator's sign-off (docs/3d-model-validation-checklist.md).

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const MB = 1024 * 1024;
// Upload limit of the developer AR Asset Deployment form.
const UPLOAD_LIMIT = 50 * MB;
// Targets for visitors on mid-range phones over mobile data.
const TARGET_SIZE = 10 * MB;
const TARGET_TRIANGLES = 100_000;
const TARGET_TEXTURE = 2048;

const DEFAULT_DIR = "3d-models/models";
const REPORT_PATH = "3d-models/check-report.md";

function findModels(target) {
  if (!existsSync(target)) return [];
  if (statSync(target).isFile()) return [target];
  return readdirSync(target).flatMap((name) => {
    const full = join(target, name);
    if (statSync(full).isDirectory()) return findModels(full);
    return [".glb", ".usdz"].includes(extname(name).toLowerCase()) ? [full] : [];
  });
}

// --- GLB parsing -----------------------------------------------------------

function parseGlb(buffer) {
  if (buffer.length < 20 || buffer.toString("ascii", 0, 4) !== "glTF") {
    throw new Error("not a binary glTF (.glb) file");
  }
  const version = buffer.readUInt32LE(4);
  if (version !== 2) throw new Error(`glTF version ${version}; model-viewer needs version 2`);

  let offset = 12;
  let json = null;
  let bin = null;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(data.toString("utf8"));
    else if (type === 0x004e4942) bin = data;
    offset += 8 + length;
  }
  if (!json) throw new Error("GLB has no JSON chunk");
  return { json, bin };
}

function countTriangles(json) {
  const accessors = json.accessors ?? [];
  const meshTriangles = (json.meshes ?? []).map((mesh) =>
    mesh.primitives.reduce((sum, prim) => {
      const mode = prim.mode ?? 4;
      const count = prim.indices !== undefined
        ? accessors[prim.indices]?.count ?? 0
        : accessors[prim.attributes?.POSITION]?.count ?? 0;
      if (mode === 4) return sum + Math.floor(count / 3); // TRIANGLES
      if (mode === 5 || mode === 6) return sum + Math.max(0, count - 2); // STRIP / FAN
      return sum;
    }, 0),
  );
  // Count each mesh once per node that places it in the scene.
  const placed = (json.nodes ?? []).filter((n) => n.mesh !== undefined).map((n) => meshTriangles[n.mesh] ?? 0);
  return placed.length ? placed.reduce((a, b) => a + b, 0) : meshTriangles.reduce((a, b) => a + b, 0);
}

function imageSize(bytes) {
  // PNG: width/height are big-endian at bytes 16 and 20.
  if (bytes.length > 24 && bytes.readUInt32BE(0) === 0x89504e47) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  // JPEG: walk the markers to the first start-of-frame.
  if (bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) { i++; continue; }
      const marker = bytes[i + 1];
      const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isSof) return { width: bytes.readUInt16BE(i + 7), height: bytes.readUInt16BE(i + 5) };
      i += 2 + bytes.readUInt16BE(i + 2);
    }
  }
  // WebP (lossy, lossless and extended variants).
  if (bytes.length > 30 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    const chunk = bytes.toString("ascii", 12, 16);
    if (chunk === "VP8 ") return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const b = bytes.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
    if (chunk === "VP8X") return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 };
  }
  return null;
}

function textureSizes(json, bin) {
  return (json.images ?? []).map((image, index) => {
    const label = image.name || `image ${index}`;
    if (image.bufferView === undefined || !bin) return { label, size: null, note: "external or embedded URI" };
    const view = json.bufferViews[image.bufferView];
    const bytes = bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
    return { label, size: imageSize(bytes), note: image.mimeType ?? "" };
  });
}

// --- Checks ------------------------------------------------------------------

function checkGlb(file, sizeBytes) {
  const result = { fails: [], warns: [], facts: [] };
  let parsed;
  try {
    parsed = parseGlb(readFileSync(file));
  } catch (error) {
    result.fails.push(error.message);
    return result;
  }
  const { json, bin } = parsed;

  const triangles = countTriangles(json);
  result.facts.push(`${triangles.toLocaleString()} triangles`);
  if (triangles === 0) result.fails.push("no triangles found; the model would be invisible");
  else if (triangles > TARGET_TRIANGLES) {
    result.warns.push(`${triangles.toLocaleString()} triangles is above the ${TARGET_TRIANGLES.toLocaleString()} target; may stutter on mid-range phones`);
  }

  const textures = textureSizes(json, bin);
  const largest = textures.reduce((max, t) => Math.max(max, t.size ? Math.max(t.size.width, t.size.height) : 0), 0);
  result.facts.push(`${textures.length} texture(s)${largest ? `, largest ${largest}px` : ""}`);
  if (textures.length === 0) result.warns.push("no textures; the model will show as plain colour");
  for (const t of textures) {
    if (t.size && Math.max(t.size.width, t.size.height) > TARGET_TEXTURE) {
      result.warns.push(`${t.label} is ${t.size.width}x${t.size.height}; above ${TARGET_TEXTURE}px wastes phone data and memory`);
    }
  }

  const animations = (json.animations ?? []).map((a, i) => a.name || `clip ${i}`);
  result.facts.push(animations.length ? `animations: ${animations.join(", ")}` : "no animations");

  const required = json.extensionsRequired ?? [];
  if (required.length) result.facts.push(`requires ${required.join(", ")}`);

  if (sizeBytes > UPLOAD_LIMIT) result.fails.push(`${(sizeBytes / MB).toFixed(1)} MB exceeds the 50 MB upload limit`);
  else if (sizeBytes > TARGET_SIZE) result.warns.push(`${(sizeBytes / MB).toFixed(1)} MB is above the ~10 MB target for mobile data`);

  return result;
}

function checkUsdz(file, sizeBytes) {
  const result = { fails: [], warns: [], facts: ["iOS AR (Quick Look) file"] };
  const head = readFileSync(file).subarray(0, 4);
  // A USDZ is an uncompressed zip archive.
  if (head.readUInt32LE(0) !== 0x04034b50) result.fails.push("not a USDZ (zip) file");
  if (sizeBytes > UPLOAD_LIMIT) result.fails.push(`${(sizeBytes / MB).toFixed(1)} MB exceeds the 50 MB upload limit`);
  else if (sizeBytes > TARGET_SIZE) result.warns.push(`${(sizeBytes / MB).toFixed(1)} MB is above the ~10 MB target for mobile data`);
  return result;
}

function runValidator(file) {
  const isWin = process.platform === "win32";
  const args = ["--yes", "@gltf-transform/cli", "validate", file];
  const run = spawnSync("npx", isWin ? args.map((a) => `"${a}"`) : args, { encoding: "utf8", shell: isWin });
  // The validator prints an ERROR section that says "No errors found." when clean.
  const output = (run.stdout ?? "").trim() || (run.stderr ?? "").trim();
  return { ok: run.status === 0 && /No errors found/i.test(output), output };
}

// --- Main ----------------------------------------------------------------------

const argv = process.argv.slice(2);
const validate = argv.includes("--validate");
const targets = argv.filter((a) => !a.startsWith("--"));
const files = (targets.length ? targets : [DEFAULT_DIR]).flatMap(findModels).sort();

if (files.length === 0) {
  console.error(`No .glb or .usdz files found in ${targets.length ? targets.join(", ") : DEFAULT_DIR}.`);
  process.exit(1);
}

const rows = [];
for (const file of files) {
  const sizeBytes = statSync(file).size;
  const isGlb = extname(file).toLowerCase() === ".glb";
  const result = isGlb ? checkGlb(file, sizeBytes) : checkUsdz(file, sizeBytes);
  if (isGlb && validate && result.fails.length === 0) {
    const v = runValidator(file);
    if (!v.ok) result.fails.push(`glTF validator reported errors:\n${v.output}`);
    else result.facts.push("glTF validator: no errors");
  }
  const status = result.fails.length ? "FAIL" : result.warns.length ? "WARN" : "PASS";
  rows.push({ file: relative(process.cwd(), file), sizeMb: (sizeBytes / MB).toFixed(1), status, ...result });

  console.log(`\n[${status}] ${relative(process.cwd(), file)}  (${(sizeBytes / MB).toFixed(1)} MB)`);
  for (const f of result.facts) console.log(`    ${f}`);
  for (const w of result.warns) console.log(`  ! ${w}`);
  for (const f of result.fails) console.log(`  x ${f}`);
}

// Each specimen folder should hold a GLB (3D viewer + Android AR) and a USDZ (iOS AR).
const byFolder = new Map();
for (const row of rows) {
  const fromDefault = relative(DEFAULT_DIR, row.file);
  const insideDefault = !fromDefault.startsWith("..") && !/^[a-z]:/i.test(fromDefault);
  const folder = insideDefault ? fromDefault.split(/[\\/]/)[0] : dirname(row.file);
  const kinds = byFolder.get(folder) ?? new Set();
  kinds.add(extname(row.file).toLowerCase());
  byFolder.set(folder, kinds);
}
const missingUsdz = [...byFolder].filter(([, kinds]) => kinds.has(".glb") && !kinds.has(".usdz")).map(([f]) => f);
if (missingUsdz.length) {
  console.log(`\nNo USDZ next to the GLB in: ${missingUsdz.join(", ")}. iPhones will fall back to model-viewer's on-the-fly conversion.`);
}

const counts = { PASS: 0, WARN: 0, FAIL: 0 };
for (const row of rows) counts[row.status]++;
console.log(`\n${rows.length} file(s): ${counts.PASS} pass, ${counts.WARN} warn, ${counts.FAIL} fail.`);

const report = [
  "# 3D model technical check",
  "",
  `Generated ${new Date().toISOString()} by tools/3d-models/check-models.mjs${validate ? " (with glTF validator)" : ""}.`,
  "",
  "| Status | File | Size (MB) | Details | Issues |",
  "| --- | --- | --- | --- | --- |",
  ...rows.map((r) =>
    `| ${r.status} | ${basename(dirname(r.file))}/${basename(r.file)} | ${r.sizeMb} | ${r.facts.join("; ")} | ${[...r.fails, ...r.warns].join("; ").replace(/\n/g, " ").replace(/\|/g, "/") || "-"} |`,
  ),
  "",
].join("\n");
mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, report);
console.log(`Report written to ${REPORT_PATH}.`);

process.exit(counts.FAIL ? 1 : 0);
