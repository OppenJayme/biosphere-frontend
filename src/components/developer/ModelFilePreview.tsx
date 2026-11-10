"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelViewerElement } from "@google/model-viewer";
import { CubeIcon, InfoIcon } from "@/components/icons";
import {
  previewStateFor,
  previewSummary,
  startModelPreview,
  type PreviewStatus,
} from "@/features/developer/model-preview";

/**
 * Local preview of a model file before it is uploaded, so the developer can check it renders
 * (orientation, scale, textures) before deploying it. The file is size-checked and must be a
 * self-contained GLB before the viewer gets a source, so the model never leaves the browser.
 */
export function ModelFilePreview({ file }: { file: File }) {
  const isGlb = file.name.toLowerCase().endsWith(".glb");
  const [status, setStatus] = useState<PreviewStatus | null>(null);
  const viewerRef = useRef<ModelViewerElement>(null);
  // Status is tied to the file it was reported for, so a replaced file starts from "validating".
  const { state, message, report } = previewStateFor(status, file);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !isGlb) return;
    return startModelPreview(viewer, file, setStatus, { loadViewer: () => import("@google/model-viewer") });
  }, [file, isGlb]);

  if (!isGlb) {
    return (
      <p className="flex items-start gap-2 rounded-lg bg-sage-50 px-3 py-2 text-xs text-zinc-600">
        <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
        USDZ files cannot be previewed in the browser. Check it on an iPhone or iPad with AR Quick Look before
        activating.
      </p>
    );
  }

  return (
    <div>
      <p className="text-xs font-medium text-zinc-700">Preview</p>
      <div className="relative mt-1 aspect-video overflow-hidden rounded-lg border border-black/10 bg-sage-50">
        <model-viewer
          ref={viewerRef}
          alt={`Preview of ${file.name}`}
          camera-controls
          auto-rotate
          shadow-intensity="1"
          style={{ width: "100%", height: "100%" }}
        />
        {(state === "validating" || state === "loading") && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-zinc-500">
            <CubeIcon className="h-8 w-8 animate-pulse" />
            <p className="mt-2 text-xs">{state === "validating" ? "Checking file…" : "Rendering preview…"}</p>
          </div>
        )}
        {state === "error" && (
          <p role="alert" className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs font-medium text-red-700">
            {message ?? "This file could not be rendered. Visitors would not be able to view it either."}
          </p>
        )}
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        {previewSummary(file.size, report)}. Drag to rotate; check orientation, scale, and textures.
      </p>
      {report && report.warnings.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-lg bg-gold-100 px-3 py-2 text-xs text-zinc-700">
          {report.warnings.map((warning) => (
            <li key={warning} className="flex items-start gap-2">
              <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
              {warning}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
