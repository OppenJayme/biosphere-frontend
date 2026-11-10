import { afterEach, describe, expect, it, vi } from "vitest";
import { glbFileError } from "./glb";
import {
  formatModelSize,
  previewStateFor,
  previewSummary,
  startModelPreview,
  type PreviewStatus,
} from "./model-preview";
import { glbFile, SELF_CONTAINED_GLTF as SELF_CONTAINED } from "./test-glb";

class FakeViewer extends EventTarget {
  src: string | null = null;
}

function setup(file: File) {
  const viewer = new FakeViewer();
  const statuses: PreviewStatus[] = [];
  const deps = {
    loadViewer: vi.fn(() => Promise.resolve()),
    createObjectURL: vi.fn((blob: File) => `blob:preview/${blob.name}`),
    revokeObjectURL: vi.fn(),
  };
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  const cleanup = startModelPreview(viewer, file, (status) => statuses.push(status), deps);
  return { viewer, statuses, deps, fetchSpy, cleanup };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("starting a model preview", () => {
  it.each([
    ["an empty file", new File([], "empty.glb")],
    ["a non-glTF file", new File([new Uint8Array(64)], "junk.glb")],
    ["a GLB with an external buffer", glbFile({ ...SELF_CONTAINED, buffers: [{ uri: "https://x.test/a.bin" }] })],
    ["a GLB with an external texture", glbFile({ ...SELF_CONTAINED, images: [{ uri: "https://x.test/t.png" }] })],
  ])("never renders or requests anything for %s", async (_label, file) => {
    const { viewer, statuses, deps, fetchSpy } = setup(file);
    await vi.waitFor(() => expect(statuses.at(-1)?.state).toBe("error"));
    expect(statuses.at(-1)?.message).toBeTruthy();
    expect(statuses.map((status) => status.state)).not.toContain("loading");
    expect(viewer.src).toBeNull();
    expect(deps.createObjectURL).not.toHaveBeenCalled();
    expect(deps.loadViewer).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders a valid self-contained GLB from a local object URL", async () => {
    const file = glbFile();
    const { viewer, statuses, deps, fetchSpy } = setup(file);
    await vi.waitFor(() => expect(viewer.src).toBe("blob:preview/heron.glb"));
    expect(deps.createObjectURL).toHaveBeenCalledWith(file);
    expect(deps.loadViewer).toHaveBeenCalledOnce();
    expect(statuses.at(-1)).toEqual({
      file,
      state: "loading",
      message: undefined,
      // The compatibility check's findings travel with the status (REQ-4.2-05).
      report: { metadata: expect.objectContaining({ textureCount: 1, triangleCount: 0 }), warnings: [] },
    });

    viewer.dispatchEvent(new Event("load"));
    expect(statuses.at(-1)?.state).toBe("ready");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports a render failure from the viewer", async () => {
    const { viewer, statuses } = setup(glbFile());
    await vi.waitFor(() => expect(viewer.src).not.toBeNull());
    viewer.dispatchEvent(new Event("error"));
    expect(statuses.at(-1)?.state).toBe("error");
  });
});

describe("replacing the previewed file", () => {
  it("releases the previous object URL and ignores its late viewer events", async () => {
    const { viewer, statuses, deps, cleanup } = setup(glbFile());
    await vi.waitFor(() => expect(viewer.src).toBe("blob:preview/heron.glb"));
    const reported = statuses.length;

    cleanup();
    expect(deps.revokeObjectURL).toHaveBeenCalledWith("blob:preview/heron.glb");
    expect(viewer.src).toBeNull();
    viewer.dispatchEvent(new Event("error"));
    viewer.dispatchEvent(new Event("load"));
    expect(statuses).toHaveLength(reported);
  });

  it("does not assign a source when the file changes while it is still being checked", async () => {
    const file = glbFile();
    const { viewer, statuses, deps, cleanup } = setup(file);
    cleanup();
    await glbFileError(file);
    await settle();
    expect(viewer.src).toBeNull();
    expect(deps.createObjectURL).not.toHaveBeenCalled();
    expect(deps.revokeObjectURL).not.toHaveBeenCalled();
    expect(statuses).toEqual([]);
  });

  it("starts the next file from a clean state instead of the previous loading or error", () => {
    const previous = glbFile(SELF_CONTAINED, "old.glb");
    const next = glbFile(SELF_CONTAINED, "new.glb");
    expect(previewStateFor(null, next)).toEqual({ state: "validating" });
    expect(previewStateFor({ file: previous, state: "error", message: "Broken" }, next)).toEqual({
      state: "validating",
    });
    expect(previewStateFor({ file: previous, state: "loading" }, next)).toEqual({ state: "validating" });
    expect(previewStateFor({ file: next, state: "ready" }, next)).toEqual({ state: "ready", message: undefined });
  });
});

describe("previewSummary", () => {
  const metadata = {
    sizeBytes: 0,
    meshCount: 1,
    triangleCount: 1,
    materialCount: 1,
    textureCount: 0,
    largestTexture: null,
    animationCount: 0,
    extensionsUsed: [],
  };

  it("shows KB under 1 MB and MB above", () => {
    expect(formatModelSize(1872)).toBe("2 KB");
    expect(formatModelSize(100)).toBe("1 KB");
    expect(formatModelSize(12.04 * 1024 * 1024)).toBe("12.0 MB");
  });

  it("uses singular and plural counts and names the largest texture", () => {
    expect(previewSummary(1872, { metadata, warnings: [] })).toBe("2 KB, 1 triangle, 1 material, 0 textures");
    expect(
      previewSummary(2048, {
        metadata: { ...metadata, triangleCount: 12_000, materialCount: 2, textureCount: 1, largestTexture: { width: 1024, height: 512 } },
        warnings: [],
      }),
    ).toBe("2 KB, 12,000 triangles, 2 materials, 1 texture (largest 1024×512)");
  });

  it("shows only the size before the check passes", () => {
    expect(previewSummary(1872)).toBe("2 KB");
  });
});
