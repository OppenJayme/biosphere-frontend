/**
 * Local GLB preview for the developer AR upload forms. The file is checked before the viewer is
 * given a source, so a rejected file never starts rendering and never triggers a request.
 */

import { inspectGlbFile, INVALID_GLB, type GlbMetadata } from "./glb";

export type PreviewState = "validating" | "loading" | "ready" | "error";
/** What the compatibility check found in an accepted file (REQ-4.2-05). */
export type PreviewReport = { metadata: GlbMetadata; warnings: string[] };
export type PreviewStatus = { file: File; state: PreviewState; message?: string; report?: PreviewReport };

function count(value: number, singular: string) {
  return `${value.toLocaleString("en-US")} ${singular}${value === 1 ? "" : "s"}`;
}

/** File size in KB under 1 MB, otherwise MB, so a small model never reads as "0.0 MB". */
export function formatModelSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** The line under the preview: size, plus what the compatibility check counted once it passes. */
export function previewSummary(sizeBytes: number, report?: PreviewReport) {
  const size = formatModelSize(sizeBytes);
  if (!report) return size;
  const { triangleCount, materialCount, textureCount, largestTexture } = report.metadata;
  const largest = largestTexture ? ` (largest ${largestTexture.width}×${largestTexture.height})` : "";
  return `${size}, ${count(triangleCount, "triangle")}, ${count(materialCount, "material")}, ${count(textureCount, "texture")}${largest}`;
}

/** The status shown for `file`; a status left over from a previous file never carries over. */
export function previewStateFor(status: PreviewStatus | null, file: File): Omit<PreviewStatus, "file"> {
  return status?.file === file
    ? { state: status.state, message: status.message, report: status.report }
    : { state: "validating" };
}

type PreviewViewer = Pick<EventTarget, "addEventListener" | "removeEventListener"> & { src: string | null };

type PreviewDeps = {
  loadViewer: () => Promise<unknown>;
  createObjectURL?: (file: File) => string;
  revokeObjectURL?: (url: string) => void;
};

/**
 * Validates `file`, then (only if it passes) loads the viewer and assigns an object URL as its
 * source. Returns a cleanup that detaches the listeners, revokes the URL, and stops a validation
 * still in flight from assigning a source later.
 */
export function startModelPreview(
  viewer: PreviewViewer,
  file: File,
  onStatus: (status: PreviewStatus) => void,
  {
    loadViewer,
    createObjectURL = (blob) => URL.createObjectURL(blob),
    revokeObjectURL = (url) => URL.revokeObjectURL(url),
  }: PreviewDeps,
) {
  let cancelled = false;
  let objectUrl: string | null = null;
  let accepted: PreviewReport | undefined;
  const report = (state: PreviewState, message?: string) => {
    if (!cancelled) onStatus({ file, state, message, report: accepted });
  };
  const onLoad = () => report("ready");
  const onError = () => report("error");

  void inspectGlbFile(file)
    .catch(() => ({ error: INVALID_GLB }))
    .then((result) => {
      if (cancelled) return;
      if (result.error !== undefined) {
        report("error", result.error);
        return;
      }
      accepted = "metadata" in result ? { metadata: result.metadata, warnings: result.warnings } : undefined;
      report("loading");
      viewer.addEventListener("load", onLoad);
      viewer.addEventListener("error", onError);
      loadViewer().catch(onError);
      objectUrl = createObjectURL(file);
      viewer.src = objectUrl;
    });

  return () => {
    cancelled = true;
    viewer.removeEventListener("load", onLoad);
    viewer.removeEventListener("error", onError);
    if (objectUrl) {
      if (viewer.src === objectUrl) viewer.src = null;
      revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  };
}
