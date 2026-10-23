/**
 * Local GLB preview for the developer AR upload forms. The file is checked before the viewer is
 * given a source, so a rejected file never starts rendering and never triggers a request.
 */

import { glbFileError, INVALID_GLB } from "./glb";

export type PreviewState = "validating" | "loading" | "ready" | "error";
export type PreviewStatus = { file: File; state: PreviewState; message?: string };

/** The status shown for `file`; a status left over from a previous file never carries over. */
export function previewStateFor(status: PreviewStatus | null, file: File): Omit<PreviewStatus, "file"> {
  return status?.file === file ? { state: status.state, message: status.message } : { state: "validating" };
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
  const report = (state: PreviewState, message?: string) => {
    if (!cancelled) onStatus({ file, state, message });
  };
  const onLoad = () => report("ready");
  const onError = () => report("error");

  void glbFileError(file)
    .catch(() => INVALID_GLB)
    .then((message) => {
      if (cancelled) return;
      if (message) {
        report("error", message);
        return;
      }
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
