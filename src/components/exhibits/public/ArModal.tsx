"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { ModelViewerElement } from "@google/model-viewer";
import { CloseIcon, CollapseIcon, CubeIcon, ExpandIcon, InfoIcon, RotateCcwIcon } from "@/components/icons";
import type { PublicArModels } from "@/features/exhibits-qr/types";

type ViewerState = "loading" | "ready" | "error";

/** Bundled picture for the Quick Look link, used when the exhibit has no image of its own. */
const AR_LAUNCH_IMAGE = "/ar-launch.svg";

/** iOS opens a `usdz` in AR Quick Look straight from a link, without the in-page viewer. */
function supportsQuickLook() {
  return document.createElement("a").relList.supports("ar");
}

function Notice({ dark, children }: { dark: boolean; children: string }) {
  return (
    <p role="status" className={`flex items-start gap-2 rounded-lg px-3.5 py-3 text-sm ${dark ? "bg-white/10" : "bg-sage-50"}`}>
      <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
      {children}
    </p>
  );
}

function ViewerButton({
  dark,
  label,
  onClick,
  children,
}: {
  dark: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-full p-2 shadow-sm backdrop-blur focus-visible:outline-none focus-visible:ring-2 ${
        dark ? "bg-forest-900/80 text-white focus-visible:ring-emerald-400" : "bg-white/90 text-forest-800 focus-visible:ring-forest-700"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * 3D viewer for the developer-deployed model, with AR offered only when the visitor's device and
 * browser can run it (REQ-4.13-04). The camera is requested only after the visitor taps View in
 * AR (REQ-4.13-05); every failure leaves the regular exhibit page usable (REQ-4.13-06/09).
 */
export function ArModal({
  title,
  models,
  posterUrl,
  dark,
  onClose,
}: {
  title: string;
  models: PublicArModels;
  posterUrl: string | null;
  dark: boolean;
  onClose: () => void;
}) {
  const viewerRef = useRef<ModelViewerElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ViewerState>("loading");
  const [canAr, setCanAr] = useState(false);
  const [arFailed, setArFailed] = useState(false);
  const [quickLook] = useState(supportsQuickLook);
  const [posterFailed, setPosterFailed] = useState(false);
  // Download progress of the model, 0 to 1; large models can take a while on mobile data.
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const poster = posterUrl && !posterFailed ? posterUrl : undefined;
  // Without a `glb` there is nothing to show in the page; the model only opens in AR.
  const heading = models.glb ? "3D Model" : "View in AR";

  // Keyboard and screen-reader users start inside the dialog and return to where they were.
  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") return onClose();
      if (event.key !== "Tab") return;

      // Keep Tab inside the dialog so keyboard focus cannot reach the page behind it.
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>("button, a[href], model-viewer"));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const onLoad = () => {
      setCanAr(viewer.canActivateAR);
      setState("ready");
    };
    const onError = () => setState("error");
    const onArStatus = (event: Event) => {
      if ((event as CustomEvent<{ status: string }>).detail.status === "failed") setArFailed(true);
    };
    const onProgress = (event: Event) => {
      setProgress((event as CustomEvent<{ totalProgress: number }>).detail.totalProgress);
    };
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    viewer.addEventListener("ar-status", onArStatus);
    viewer.addEventListener("progress", onProgress);

    // The viewer is large, so it is only downloaded once a visitor opens it.
    import("@google/model-viewer").catch(onError);

    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
      viewer.removeEventListener("ar-status", onArStatus);
      viewer.removeEventListener("progress", onProgress);
    };
  }, []);

  /** Puts the camera back where it started after the visitor has rotated or zoomed away. */
  function resetView() {
    const viewer = viewerRef.current;
    if (!viewer) return;
    viewer.cameraOrbit = "auto auto auto";
    viewer.cameraTarget = "auto auto auto";
    viewer.fieldOfView = "auto";
    viewer.resetTurntableRotation();
    viewer.jumpCameraToGoal();
  }

  const muted = dark ? "text-white/60" : "text-zinc-500";
  const primaryButton = `w-full rounded-lg py-2.5 text-sm font-semibold ${
    dark ? "bg-emerald-400 text-emerald-950" : "bg-forest-800 text-white"
  }`;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-black/60 ${expanded ? "items-stretch" : "items-end sm:items-center sm:p-4"}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`3D model of ${title}`}
        tabIndex={-1}
        className={`w-full p-5 focus:outline-none ${
          expanded ? "flex h-full flex-col" : "max-w-sm rounded-t-2xl sm:rounded-2xl"
        } ${dark ? "bg-forest-900 text-white" : "bg-white text-zinc-900"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold">{heading}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={dark ? "text-white/60" : "text-zinc-400"}>
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className={`mt-4 space-y-3 ${expanded ? "flex min-h-0 flex-1 flex-col" : ""}`}>
          {models.glb ? (
            <>
              <div
                className={`relative overflow-hidden rounded-xl ${expanded ? "min-h-0 flex-1" : "aspect-square"} ${
                  dark ? "bg-black/30" : "bg-sage-50"
                }`}
                hidden={state === "error"}
              >
                <model-viewer
                  ref={viewerRef}
                  src={models.glb}
                  ios-src={models.usdz ?? undefined}
                  poster={poster}
                  alt={`3D model of ${title}`}
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  camera-controls
                  // A slow turn shows the model is 3D; it stops while the visitor drags it.
                  auto-rotate
                  auto-rotate-delay="1500"
                  rotation-per-second="20deg"
                  touch-action="pan-y"
                  shadow-intensity="1"
                  style={{ width: "100%", height: "100%" }}
                >
                  {/* Replaces the built-in AR button; AR starts from the labelled button below. */}
                  <span slot="ar-button" />
                  {/* Replaces the built-in progress bar with the labelled one below. */}
                  <span slot="progress-bar" />
                </model-viewer>
                {/* The exhibit photo stays in place if it fails; the cube placeholder takes over. */}
                {poster && state === "loading" && (
                  // eslint-disable-next-line @next/next/no-img-element -- probe only, never shown
                  <img src={poster} alt="" hidden onError={() => setPosterFailed(true)} />
                )}
                {state === "loading" && (
                  <div className={`pointer-events-none absolute inset-0 flex flex-col items-center p-4 ${poster ? "justify-end" : "justify-center"} ${muted}`}>
                    {!poster && <CubeIcon className="h-10 w-10 animate-pulse" />}
                    <div
                      className={`w-full max-w-48 rounded-lg px-3 py-2 ${poster ? (dark ? "bg-forest-900/85" : "bg-white/85") : "mt-2.5"}`}
                    >
                      <p className="text-center text-xs">Loading 3D model… {Math.round(progress * 100)}%</p>
                      <div
                        role="progressbar"
                        aria-label="3D model download"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progress * 100)}
                        className={`mt-1.5 h-1.5 overflow-hidden rounded-full ${dark ? "bg-white/15" : "bg-black/10"}`}
                      >
                        <div
                          className={`h-full rounded-full transition-[width] duration-200 ${dark ? "bg-emerald-400" : "bg-forest-700"}`}
                          style={{ width: `${Math.max(progress * 100, 4)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {state === "ready" && (
                  <div className="absolute right-2 top-2 flex gap-1.5">
                    <ViewerButton dark={dark} label="Reset view" onClick={resetView}>
                      <RotateCcwIcon className="h-4 w-4" />
                    </ViewerButton>
                    <ViewerButton
                      dark={dark}
                      label={expanded ? "Exit full screen" : "Full screen"}
                      onClick={() => setExpanded((value) => !value)}
                    >
                      {expanded ? <CollapseIcon className="h-4 w-4" /> : <ExpandIcon className="h-4 w-4" />}
                    </ViewerButton>
                  </div>
                )}
              </div>

              {state === "error" && (
                <Notice dark={dark}>
                  The 3D model could not be loaded. Everything else about this exhibit is still on the page.
                </Notice>
              )}
              {state === "ready" && canAr && !arFailed && (
                <>
                  <button type="button" onClick={() => viewerRef.current?.activateAR()} className={primaryButton}>
                    View in AR
                  </button>
                  <p className={`text-xs ${muted}`}>
                    Drag to rotate and pinch to zoom. Your camera turns on only after you tap View in AR.
                  </p>
                </>
              )}
              {state === "ready" && arFailed && (
                <Notice dark={dark}>AR could not start on this device. You can still rotate and zoom the model here.</Notice>
              )}
              {state === "ready" && !canAr && !arFailed && (
                <Notice dark={dark}>
                  AR is not supported on this device or browser. You can still rotate and zoom the model here.
                </Notice>
              )}
            </>
          ) : models.usdz && quickLook ? (
            <>
              {/* AR Quick Look needs the link to wrap a single image. */}
              <a rel="ar" href={models.usdz} className="block overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived link */}
                <img
                  src={posterUrl && !posterFailed ? posterUrl : AR_LAUNCH_IMAGE}
                  alt={`View ${title} in AR`}
                  onError={() => setPosterFailed(true)}
                  className="aspect-square w-full object-cover"
                />
              </a>
              <p className={`text-xs ${muted}`}>Tap the picture to place the model in your space. Your camera turns on only then.</p>
            </>
          ) : (
            <Notice dark={dark}>
              The 3D model for this exhibit only opens in AR on an iPhone or iPad. Everything else about it is still on the page.
            </Notice>
          )}

          {(state === "error" || !models.glb) && (
            <button type="button" onClick={onClose} className={primaryButton}>
              Continue to Exhibit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
