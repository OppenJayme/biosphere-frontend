import { describe, expect, it } from "vitest";
import {
  externalGltfReferences,
  GLB_TOO_LARGE,
  glbFileError,
  inspectGlbFile,
  MAX_GLB_SIZE_BYTES,
  textureTooLargeMessage,
} from "./glb";
import { glbBytes, glbFile, pngHeader, SELF_CONTAINED_GLTF } from "./test-glb";
import { AR_ASSET_MAX_BYTES } from "./types";

describe("GLB external references", () => {
  it("finds buffer, image, and extension URIs but allows embedded data: URIs", () => {
    expect(externalGltfReferences(SELF_CONTAINED_GLTF)).toEqual([]);
    expect(externalGltfReferences({ buffers: [{ uri: "data:application/octet-stream;base64,AAAA" }] })).toEqual([]);
    expect(
      externalGltfReferences({
        buffers: [{ uri: "https://tracker.test/mesh.bin" }],
        images: [{ uri: "texture.png" }],
        extensions: { VENDOR_audio: { sources: [{ uri: "//cdn.test/sound.mp3" }] } },
      }),
    ).toEqual(["https://tracker.test/mesh.bin", "texture.png", "//cdn.test/sound.mp3"]);
  });
});

describe("GLB file check", () => {
  it("reuses the upload's non-empty and 50 MB limits", async () => {
    expect(await glbFileError(new File([], "empty.glb"))).toBe("Choose a non-empty AR model file.");
    const oversized = new File([new Uint8Array(1)], "big.glb");
    Object.defineProperty(oversized, "size", { value: AR_ASSET_MAX_BYTES + 1 });
    expect(await glbFileError(oversized)).toBe("The AR model must be 50 MB or smaller.");
  });

  it("rejects files that are not well-formed binary glTF", async () => {
    expect(await glbFileError(new File([new Uint8Array(32)], "zeros.glb"))).toMatch(/not a valid binary glTF/);
    const truncated = glbBytes(SELF_CONTAINED_GLTF).slice(0, 24);
    expect(await glbFileError(new File([truncated], "cut.glb"))).toMatch(/not a valid binary glTF/);
    const badJson = glbBytes(SELF_CONTAINED_GLTF);
    badJson[20] = 0x7b;
    badJson[21] = 0x7b;
    expect(await glbFileError(new File([badJson], "json.glb"))).toMatch(/not a valid binary glTF/);
  });

  it("rejects external buffers and textures and accepts a self-contained model", async () => {
    expect(
      await glbFileError(glbFile({ ...SELF_CONTAINED_GLTF, buffers: [{ uri: "https://x.test/a.bin" }] })),
    ).toMatch(/references external files/);
    expect(await glbFileError(glbFile({ ...SELF_CONTAINED_GLTF, images: [{ uri: "skin.png" }] }))).toMatch(
      /references external files/,
    );
    expect(await glbFileError(glbFile())).toBeUndefined();
  });
});

describe("GLB Scene Viewer compatibility (REQ-4.2-05)", () => {
  it("rejects a GLB over 15 MB before reading it", async () => {
    const big = glbFile();
    Object.defineProperty(big, "size", { value: MAX_GLB_SIZE_BYTES + 1 });
    expect(await glbFileError(big)).toBe(GLB_TOO_LARGE);
  });

  it("rejects compressed models and oversized textures, as the backend does", async () => {
    expect(
      await glbFileError(glbFile({ ...SELF_CONTAINED_GLTF, extensionsUsed: ["KHR_draco_mesh_compression"] })),
    ).toMatch(/KHR_draco_mesh_compression .*cannot open/);
    expect(await glbFileError(glbFile(SELF_CONTAINED_GLTF, "big.glb", pngHeader(4096, 4096)))).toBe(
      textureTooLargeMessage(4096, 4096),
    );
  });

  it("returns metadata and warnings for an accepted model", async () => {
    const result = await inspectGlbFile(
      glbFile({
        ...SELF_CONTAINED_GLTF,
        accessors: [{ count: 300_003 }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
        nodes: [{ mesh: 0 }],
      }),
    );
    expect(result.error).toBeUndefined();
    expect(result).toMatchObject({
      metadata: { triangleCount: 100_001, textureCount: 1, largestTexture: { width: 1, height: 1 } },
      warnings: [expect.stringContaining("100,001 triangles")],
    });
  });
});
