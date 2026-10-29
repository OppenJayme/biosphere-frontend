# BioSphere 3D Model Validation Checklist

Use this checklist for every AR/3D asset before it is activated on a public QR
exhibit page. It records the "successful technical validation" that SRS
REQ-4.13-03 requires before the Developer activates an asset, and the curator
approval that BR-10 requires before anything reaches the public.

The generation steps are in `tools/3d-models/README.md`. Copy the per-model
section below once per specimen, or keep the same columns in a shared
spreadsheet.

## Scope

This checklist covers:

- source photos sent to Tripo;
- the generated GLB (3D viewer, Android AR) and USDZ (iPhone AR);
- the technical check, the visual review and the real-device test;
- curator approval and activation through the developer AR Asset Deployment
  page.

It does not cover selecting the specimens (a curator decision, REQ-4.13-02),
exhibit text, or QR code printing.

## Before the batch

- [ ] The curator's list of selected specimens is written down, with backups.
- [ ] Written permission to create and publish 3D models of the selected
      specimens is on file (SRS: "documented legal authorization for use").
- [ ] Photos are sorted into `3d-models/photos/<ACCESSION>_<slug>/` with at
      least a `front` view.
- [ ] `npm run 3d:manifest` shows no unresolved warnings for the specimens
      being generated.
- [ ] `tripo balance` covers the estimated credits.
- [ ] A test batch of 1–3 specimens was reviewed before running the rest.

## Per-model checklist

**Specimen:** `ACCESSION_slug` · **Tripo task / @name:** · **Checked by / date:**

### 1. Technical check (`npm run 3d:check -- --validate`)

- [ ] Status is PASS or WARN, not FAIL.
- [ ] glTF validator reports no errors.
- [ ] GLB is under 10 MB (hard limit 50 MB).
- [ ] Triangle count is 100k or less.
- [ ] Textures are 2048 px or smaller.
- [ ] A USDZ was produced next to the GLB.

### 2. Visual review (`tripo view @name`)

- [ ] Front, back, sides, top and underside all look like the specimen. No
      invented parts, melted areas or holes.
- [ ] Body parts are complete and the right count: legs, antennae, fins,
      wings, petals.
- [ ] Proportions and symmetry match the photos.
- [ ] Texture colour and pattern match the specimen. No background, jar
      glass, labels or hands baked into the texture.
- [ ] No floating fragments around the model.

If any of these fail, regenerate (`tripo redo @name`) or re-shoot the photos
before spending time on later steps.

### 3. Real-device test

Upload through the developer AR Asset Deployment page with **"Activate
immediately" unticked**, on a development or staging environment.

| Check | Android (device / browser) | iPhone (device / browser) |
| --- | --- | --- |
| 3D view loads in under ~5 s on mobile data | ☐ | ☐ |
| Rotate and zoom are smooth | ☐ | ☐ |
| "View in AR" opens the camera experience | ☐ | ☐ |
| Model appears at a believable real-world size | ☐ | ☐ |
| Model sits on the floor or table (not floating or sunk) | ☐ | ☐ |
| Denying camera permission keeps the exhibit page usable | ☐ | ☐ |

### 4. Curator approval

- [ ] Curator reviewed the model (screenshots or the live 3D view) and confirms
      it is accurate enough for public display.
- [ ] If the model has animations, the curator approved each animation as
      biologically appropriate.
- [ ] Curator name and date recorded: ____________________

### 5. Activation

- [ ] Asset activated on `/developer` with an authorization note that names the
      curator approval.
- [ ] Exhibit page shows the View in 3D/AR action in production.
- [ ] Result recorded: **Activated** / **Rejected (reason)** / **Replaced by
      backup specimen**.

## Rejection guidance

Swap in a backup specimen instead of repairing a model by hand when:

- the specimen is in a jar or behind glass and the texture keeps picking up
  reflections;
- two regenerations from improved photos still fail the visual review; or
- the curator does not approve the result.

The SRS targets "approximately 20" AR exhibits and allows the final number to
change with asset quality, so dropping a specimen that fails review is
within scope.
