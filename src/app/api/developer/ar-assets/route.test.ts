import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/developer/session", () => ({
  getDeveloperAccess: vi.fn(async () => ({ state: "developer" })),
}));
vi.mock("@/features/developer/api", () => ({
  createArAsset: vi.fn(),
  replaceArAssetFile: vi.fn(),
}));
vi.mock("@/lib/api-client", () => ({ ApiError: class ApiError extends Error {} }));

import { createArAsset, replaceArAssetFile } from "@/features/developer/api";
import { glbFile, SELF_CONTAINED_GLTF } from "@/features/developer/test-glb";
import { POST, PUT } from "./route";

const EXHIBIT_ID = "3f1c2a9e-6b1d-4c1e-9a7a-2f1b3c4d5e6f";
const ASSET_ID = "8a6e0c1b-2d3f-4a5b-8c7d-9e0f1a2b3c4d";
const ENDPOINT = "http://localhost:3000/api/developer/ar-assets";

const EXTERNAL_BUFFER = glbFile({ ...SELF_CONTAINED_GLTF, buffers: [{ uri: "https://x.test/mesh.bin" }] });
const EXTERNAL_TEXTURE = glbFile({ ...SELF_CONTAINED_GLTF, images: [{ uri: "https://x.test/bark.png" }] });

function request(method: "POST" | "PUT", file: File) {
  const body = new FormData();
  if (method === "POST") {
    body.set("exhibitId", EXHIBIT_ID);
  } else {
    body.set("assetId", ASSET_ID);
  }
  body.set("modelFormat", "glb");
  body.set("file", file);
  body.set("authorizationReference", "Curator AR approval memo 2026-07");
  return new Request(ENDPOINT, { method, body, headers: { origin: "http://localhost:3000" } });
}

beforeEach(() => {
  vi.mocked(createArAsset).mockReset();
  vi.mocked(replaceArAssetFile).mockReset();
});

describe.each([
  ["POST", POST, createArAsset],
  ["PUT", PUT, replaceArAssetFile],
] as const)("%s /api/developer/ar-assets GLB checks", (method, handler, backend) => {
  it.each([
    ["an external buffer", EXTERNAL_BUFFER],
    ["an external texture", EXTERNAL_TEXTURE],
  ])("rejects a GLB with %s and never reaches the backend", async (_label, file) => {
    const response = await handler(request(method, file));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: expect.stringMatching(/references external files/) });
    expect(backend).not.toHaveBeenCalled();
  });

  it("rejects a GLB with only the magic bytes and a broken structure", async () => {
    const magicOnly = new File([new Uint8Array([0x67, 0x6c, 0x54, 0x46, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])], "x.glb");
    const response = await handler(request(method, magicOnly));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "This file is not a valid binary glTF (.glb) model." });
    expect(backend).not.toHaveBeenCalled();
  });

  it("forwards a self-contained GLB", async () => {
    vi.mocked(backend).mockResolvedValue({ id: ASSET_ID } as never);
    const response = await handler(request(method, glbFile()));
    expect(response.status).toBe(method === "POST" ? 201 : 200);
    expect(backend).toHaveBeenCalledOnce();
  });
});
