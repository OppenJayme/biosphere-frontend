/**
 * The exhibit's AR / 3D viewer (SRS 4.13). @google/model-viewer is loaded only after the visitor
 * taps, and the camera is only requested when they press "Start AR" (REQ-4.13-05). Every failure
 * ends in a plain message and leaves the exhibit page untouched (REQ-4.13-06, -09).
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, CubeIcon, InfoIcon } from "@/components/icons";
import type { ArCapability } from "@/features/exhibits-qr/ar-support";
import { refreshExhibitArAction } from "@/features/exhibits-qr/public-actions";
import type { PublicArModel } from "@/features/exhibits-qr/types";

type ModelViewerElement = HTMLElement & {
  canActivateAR: boolean;
  activateAR(): Promise<void>;
};

type Phase =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "failed"; message: string };

const MESSAGES = {
  unavailable: "AR isn't available for this exhibit right now. Everything about the specimen is still on this page.",
  load: "The 3D model couldn't load. Check your connection and try again. The exhibit information is still on this page.",
  ar: "AR couldn't start on this device. You can still turn the 3D model with your finger, and everything about the specimen is on this page.",
  unsupported: "This device or browser doesn't support AR. You can still turn the 3D model with your finger.",
} as const;

export function ArModal({
  slug,
  name,
  models,
  capability,
  dark,
  onClose,
}: {
  slug: string;
  name: string;
  models: PublicArModel[];
  capability: Exclude<ArCapability, "none">;
  dark: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerElement | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [arNote, setArNote] = useState<string | null>(null);
  const [canStartAr, setCanStartAr] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let viewer: ModelViewerElement | null = null;

    async function mount() {
      // Signed model URLs are short-lived; fetch fresh ones, falling back to the page's copy.
      const refreshed = await refreshExhibitArAction(slug);
      if (cancelled) return;
      if (refreshed.status === "unavailable") {
        setPhase({ kind: "failed", message: MESSAGES.unavailable });
        return;
      }
      const current = refreshed.status === "ok" ? refreshed.ar.models : models;
      const glb = current.find((model) => model.format === "glb");
      const usdz = current.find((model) => model.format === "usdz");

      try {
        await import("@google/model-viewer");
      } catch {
        if (!cancelled) setPhase({ kind: "failed", message: MESSAGES.load });
        return;
      }
      if (cancelled || !stageRef.current) return;

      viewer = document.createElement("model-viewer") as ModelViewerElement;
      if (glb) viewer.setAttribute("src", glb.url);
      if (usdz) viewer.setAttribute("ios-src", usdz.url);
      viewer.setAttribute("alt", `3D model of the ${name} specimen`);
      viewer.setAttribute("camera-controls", "");
      viewer.setAttribute("touch-action", "pan-y");
      viewer.setAttribute("shadow-intensity", "1");
      if (capability === "ar") {
        viewer.setAttribute("ar", "");
        viewer.setAttribute("ar-modes", "webxr scene-viewer quick-look");
        // Hide model-viewer's built-in AR button; the "Start AR" button below replaces it.
        const hiddenArButton = document.createElement("span");
        hiddenArButton.slot = "ar-button";
        hiddenArButton.hidden = true;
        viewer.append(hiddenArButton);
      }
      viewer.style.width = "100%";
      viewer.style.height = "100%";
      viewer.style.backgroundColor = "transparent";

      viewer.addEventListener("load", () => {
        if (cancelled) return;
        setPhase({ kind: "ready" });
        setCanStartAr(capability === "ar" && Boolean(viewer?.canActivateAR));
        if (capability === "ar" && !viewer?.canActivateAR) setArNote(MESSAGES.unsupported);
      });
      viewer.addEventListener("error", () => {
        if (!cancelled) setPhase({ kind: "failed", message: MESSAGES.load });
      });
      viewer.addEventListener("ar-status", (event) => {
        const status = (event as CustomEvent<{ status?: string }>).detail?.status;
        if (!cancelled && status === "failed") setArNote(MESSAGES.ar);
      });

      // Quick Look (iOS) needs a usdz file or a glb to convert; without either there is nothing to show.
      if (!glb && !usdz) {
        setPhase({ kind: "failed", message: MESSAGES.unavailable });
        return;
      }
      stageRef.current.append(viewer);
      viewerRef.current = viewer;
      // A usdz-only exhibit has nothing to render in 3D, but iOS can still open it in Quick Look.
      if (!glb && usdz) {
        setPhase({ kind: "ready" });
        setCanStartAr(capability === "ar");
      }
    }

    void mount();
    return () => {
      cancelled = true;
      viewer?.remove();
      viewerRef.current = null;
    };
  }, [slug, name, models, capability]);

  async function startAr() {
    setArNote(null);
    try {
      await viewerRef.current?.activateAR();
    } catch {
      setArNote(MESSAGES.ar);
    }
  }

  const muted = dark ? "text-white/60" : "text-zinc-500";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="ar-viewer-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={`m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl p-0 backdrop:bg-black/60 ${
        dark ? "bg-forest-900 text-white" : "bg-white text-zinc-900"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 id="ar-viewer-title" className="font-serif text-lg font-semibold">
            {capability === "ar" ? `${name} in AR` : `${name} in 3D`}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className={dark ? "text-white/60" : "text-zinc-400"}>
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className={`relative mt-4 aspect-square overflow-hidden rounded-xl ${dark ? "bg-white/5" : "bg-sage-50"}`}>
          <div ref={stageRef} className="h-full w-full" />
          {phase.kind === "loading" && (
            <div role="status" className={`absolute inset-0 flex flex-col items-center justify-center text-center ${muted}`}>
              <CubeIcon className="h-10 w-10 motion-safe:animate-pulse" />
              <p className="mt-2.5 text-xs">Loading the 3D model…</p>
            </div>
          )}
          {phase.kind === "failed" && (
            <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-sm">
              <InfoIcon className="h-6 w-6 text-gold-500" />
              {phase.message}
            </div>
          )}
        </div>

        {phase.kind === "ready" && (
          <p className={`mt-3 text-xs ${muted}`}>
            {capability === "ar"
              ? "Drag to turn the model. Start AR to place it in your room; your browser will ask to use the camera."
              : "Drag to turn the model, and pinch or scroll to zoom."}
          </p>
        )}
        {arNote && (
          <p role="alert" className={`mt-3 flex gap-2 rounded-lg px-3 py-2.5 text-xs ${dark ? "bg-white/10" : "bg-sage-50"}`}>
            <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-500" />
            {arNote}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          {canStartAr && phase.kind === "ready" && (
            <button
              type="button"
              onClick={startAr}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold ${
                dark ? "bg-emerald-400 text-emerald-950" : "bg-forest-800 text-white"
              }`}
            >
              <CubeIcon className="h-4 w-4" />
              Start AR
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 rounded-lg border py-2.5 text-sm font-semibold ${
              dark ? "border-white/30 text-white" : "border-forest-800 text-forest-800"
            }`}
          >
            Back to exhibit
          </button>
        </div>
      </div>
    </dialog>
  );
}
