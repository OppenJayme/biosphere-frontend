import { afterEach, describe, expect, it, vi } from "vitest";
import { glbFileError } from "./glb";
import { previewStateFor, startModelPreview, type PreviewStatus } from "./model-preview";
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
    expect(statuses.at(-1)).toEqual({ file, state: "loading", message: undefined });

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
