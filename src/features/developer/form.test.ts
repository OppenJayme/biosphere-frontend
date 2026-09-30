import { describe, expect, it } from "vitest";
import {
  matchesModelSignature,
  readArAssetCreateForm,
  readArAssetReplaceForm,
  readCuratorStatusForm,
  readOnboardCuratorForm,
  toCreateArAssetFormData,
  toReplaceArAssetFormData,
} from "./form";
import { AR_ASSET_MAX_BYTES } from "./types";

const EXHIBIT_ID = "3f1c2a9e-6b1d-4c1e-9a7a-2f1b3c4d5e6f";
const ASSET_ID = "8a6e0c1b-2d3f-4a5b-8c7d-9e0f1a2b3c4d";

function glbFile(name = "heron.glb", size?: number) {
  const bytes = size === undefined ? new Uint8Array([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0]) : new Uint8Array(size);
  return new File([bytes], name);
}

function createForm(overrides: Record<string, string | File | null> = {}) {
  const values: Record<string, string | File | null> = {
    exhibitId: EXHIBIT_ID,
    modelFormat: "glb",
    file: glbFile(),
    authorizationConfirmed: "on",
    ...overrides,
  };
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== null) form.set(key, value);
  }
  return form;
}

describe("curator onboarding form", () => {
  it("trims the name and normalizes the email", () => {
    const form = new FormData();
    form.set("email", "  Curator@USC.edu.ph ");
    form.set("fullName", "  Maria Santos ");

    const parsed = readOnboardCuratorForm(form);
    expect(parsed.result.success && parsed.result.data).toEqual({
      email: "curator@usc.edu.ph",
      fullName: "Maria Santos",
    });
  });

  it("rejects an invalid email and keeps the typed values", () => {
    const form = new FormData();
    form.set("email", "not-an-email");
    form.set("fullName", "Maria Santos");

    const parsed = readOnboardCuratorForm(form);
    expect(parsed.result.success).toBe(false);
    expect(parsed.values.email).toBe("not-an-email");
  });
});

describe("curator status form", () => {
  it("requires a recorded formal authorization", () => {
    const form = new FormData();
    form.set("status", "INACTIVE");
    form.set("authorizationReason", "   ");

    const parsed = readCuratorStatusForm(form);
    expect(parsed.success).toBe(false);
    expect(!parsed.success && parsed.error.issues[0]?.message).toMatch(/formal authorization/);
  });

  it("only allows ACTIVE or INACTIVE", () => {
    const form = new FormData();
    form.set("status", "ARCHIVED");
    form.set("authorizationReason", "Memo 2026-14");

    expect(readCuratorStatusForm(form).success).toBe(false);
  });

  it("rejects authorization notes over the backend's 500-character limit", () => {
    const form = new FormData();
    form.set("status", "ACTIVE");
    form.set("authorizationReason", "x".repeat(501));

    expect(readCuratorStatusForm(form).success).toBe(false);
  });
});

describe("AR asset upload form", () => {
  it("accepts a GLB for an exhibit when authorization is confirmed", () => {
    const parsed = readArAssetCreateForm(createForm());
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.isEnabled).toBe(false);
  });

  it("requires the authorization confirmation", () => {
    const parsed = readArAssetCreateForm(createForm({ authorizationConfirmed: null }));
    expect(parsed.success).toBe(false);
  });

  it("rejects a file whose extension does not match the selected format", () => {
    const parsed = readArAssetCreateForm(createForm({ modelFormat: "usdz" }));
    expect(parsed.success).toBe(false);
    expect(!parsed.success && parsed.error.issues[0]?.message).toMatch(/\.glb but the selected format is USDZ/);
  });

  it("rejects multi-file glTF and oversized models", () => {
    expect(readArAssetCreateForm(createForm({ file: glbFile("heron.gltf") })).success).toBe(false);
    expect(readArAssetCreateForm(createForm({ file: glbFile("heron.glb", AR_ASSET_MAX_BYTES + 1) })).success).toBe(false);
  });

  it("requires an exhibit UUID", () => {
    expect(readArAssetCreateForm(createForm({ exhibitId: "exhibit-12" })).success).toBe(false);
  });

  it("forwards only backend-allowlisted fields", () => {
    const parsed = readArAssetCreateForm(createForm({ isEnabled: "on" }));
    if (!parsed.success) throw new Error("expected a valid form");

    const body = toCreateArAssetFormData(parsed.data);
    expect([...body.keys()].sort()).toEqual(["exhibitId", "file", "isEnabled", "modelFormat"]);
    expect(body.get("isEnabled")).toBe("true");
    expect((body.get("file") as File).name).toBe("heron.glb");
  });

  it("sends the MIME type the backend storage rules require, not the browser's guess", () => {
    const parsed = readArAssetCreateForm(createForm());
    if (!parsed.success) throw new Error("expected a valid form");

    expect(parsed.data.file.type).toBe("");
    expect((toCreateArAssetFormData(parsed.data).get("file") as File).type).toBe("model/gltf-binary");
  });
});

describe("AR asset replacement form", () => {
  it("sends only the file and its format", () => {
    const form = createForm({ assetId: ASSET_ID, exhibitId: null });
    const parsed = readArAssetReplaceForm(form);
    if (!parsed.success) throw new Error("expected a valid form");

    const body = toReplaceArAssetFormData(parsed.data);
    expect([...body.keys()].sort()).toEqual(["file", "modelFormat"]);
    expect((body.get("file") as File).type).toBe("model/gltf-binary");
  });

  it("requires a valid asset ID", () => {
    expect(readArAssetReplaceForm(createForm({ assetId: "abc" })).success).toBe(false);
  });
});

describe("model file signatures", () => {
  it("recognizes binary glTF and USDZ (ZIP) headers", () => {
    expect(matchesModelSignature("glb", new Uint8Array([0x67, 0x6c, 0x54, 0x46]))).toBe(true);
    expect(matchesModelSignature("usdz", new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe(true);
  });

  it("rejects a renamed file", () => {
    expect(matchesModelSignature("glb", new Uint8Array([0x50, 0x4b, 0x03, 0x04]))).toBe(false);
    expect(matchesModelSignature("usdz", new Uint8Array([0x67, 0x6c]))).toBe(false);
  });
});
