# 3D model pipeline (Tripo CLI)

Developer-side tooling for producing the AR/3D assets of curator-approved QR
exhibits (SRS 4.13). Nothing here runs inside the app: the models are made on a
developer machine, checked, and then uploaded through the developer
**AR Asset Deployment** page (`/developer`), which keeps REQ-4.13-03's
"deploy, validate, then activate" flow and its audit trail.

```
curator approves specimen → photos → build manifest → tripo batch run
→ check-models + visual review + phone test → upload inactive → activate
```

Working files (photos, generated models, batch state) live in `3d-models/` at
the repo root, which is git-ignored. Specimen photos and paid model output never
go into the repository.

## One-time setup

```powershell
npm install -g tripo-cli      # needs Node.js 20+
tripo login --region ov       # browser sign-in; the key is stored by the CLI, not in this repo
tripo doctor                  # confirms key, network and region
tripo balance                 # credits available
```

Never paste the Tripo API key (`tsk_...`) into code, `.env` files in the repo,
chat or screenshots. If a teammate needs to run the batch, they log in with
their own `tripo login`.

## 1. Arrange the photos

One folder per specimen, named `<ACCESSION>_<slug>`:

```
3d-models/photos/
  USCBM-REP-2025-002_green-sea-turtle/
    front.jpg  back.jpg  left.jpg  right.jpg
    extra/        45° angles, top, close-ups, ruler shot, label shot
```

- `front` is required. `back`, `left` and `right` are optional but give much
  better backs and sides. Name the files exactly `front`, `back`, `left`,
  `right` (any case, any extension below).
- Accepted: JPG, PNG, WebP, BMP, TIFF, each up to 20 MB. HEIC is not accepted;
  set iPhones to Settings > Camera > Formats > **Most Compatible** before shooting.
- `extra/` is not sent to Tripo. Keep it for the curator review and for
  re-shoots.

## 2. Build the batch manifest (free)

```powershell
npm run 3d:manifest                          # every specimen folder
npm run 3d:manifest -- --only green-sea-turtle   # just one (recommended first)
```

This writes `3d-models/tripo-batch.yaml`, lists missing views and bad files per
specimen, and prints a credit estimate from `tripo make --dry-run` (no upload,
no charge). Every job uses the `ar-web` preset: a ~20k-face GLB for the 3D
viewer and Android AR, plus a USDZ for iPhone AR. At the time of writing, that
costs about 110 credits per specimen.

## 3. Generate (spends credits)

```powershell
tripo balance
tripo batch run 3d-models/tripo-batch.yaml
```

- Start with one or two specimens (`--only`) and review them before running
  the rest.
- The batch is resumable. Re-running skips finished specimens, so you can add
  photo folders, rebuild the manifest and run it again.
- A job that ends as `needs_attention` is never resubmitted automatically. Read
  the `suggestion` for it in `3d-models/tripo-batch.yaml.state.json`.
- Tripo refunds tasks that fail on its side. It does not refund results that
  only look bad, so review before regenerating.
- To regenerate one bad result with a different seed: `tripo redo @<name>`
  (paid, no confirmation prompt).

## 4. Check each model

```powershell
npm run 3d:check                 # technical check of everything in 3d-models/models
npm run 3d:check -- --validate   # also runs the Khronos glTF validator (via npx)
tripo view @<name>               # rotate it in the browser (PowerShell: quote it, '@name')
```

`3d:check` reports file size, triangle count, texture sizes and animation clips,
writes `3d-models/check-report.md` and fails on anything the upload form would
reject. Targets: under 10 MB, at most 100k triangles, textures at most 2048 px.

Then follow `docs/3d-model-validation-checklist.md` for the visual review, the
phone test and the curator sign-off.

## 5. Deploy

On `/developer`, upload the GLB and the USDZ for the exhibit **with "Activate
immediately" unticked**, test on a real Android phone and iPhone, then activate.
