"use client";

import { useEffect, useRef, useState, type DetailedHTMLProps, type HTMLAttributes } from "react";
import type { ModelViewerElement } from "@google/model-viewer";
import { CloseIcon, CubeIcon, InfoIcon } from "@/components/icons";
import type { PublicArModels } from "@/features/exhibits-qr/types";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": DetailedHTMLProps<HTMLAttributes<ModelViewerElement>, ModelViewerElement> & {
        src?: string;
        "ios-src"?: string;
        alt?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "camera-controls"?: boolean;
        "touch-action"?: string;
        "shadow-intensity"?: string;
      };
    }
  }
}

type ViewerState = "loading" | "ready" | "error";

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
  const [state, setState] = useState<ViewerState>("loading");
  const [canAr, setCanAr] = useState(false);
  const [arFailed, setArFailed] = useState(false);
  const [quickLook] = useState(supportsQuickLook);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
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
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("error", onError);
    viewer.addEventListener("ar-status", onArStatus);

    // The viewer is large, so it is only downloaded once a visitor opens it.
    import("@google/model-viewer").catch(onError);

    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("error", onError);
      viewer.removeEventListener("ar-status", onArStatus);
    };
  }, []);

  const muted = dark ? "text-white/60" : "text-zinc-500";
  const primaryButton = `w-full rounded-lg py-2.5 text-sm font-semibold ${
    dark ? "bg-emerald-400 text-emerald-950" : "bg-forest-800 text-white"
  }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`3D model of ${title}`}
        className={`w-full max-w-sm rounded-t-2xl p-5 sm:rounded-2xl ${dark ? "bg-forest-900 text-white" : "bg-white text-zinc-900"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold">3D Model</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={dark ? "text-white/60" : "text-zinc-400"}>
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {models.glb ? (
            <>
              <div className={`relative aspect-square overflow-hidden rounded-xl ${dark ? "bg-black/30" : "bg-sage-50"}`} hidden={state === "error"}>
                <model-viewer
                  ref={viewerRef}
                  src={models.glb}
                  ios-src={models.usdz ?? undefined}
                  alt={`3D model of ${title}`}
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  camera-controls
                  touch-action="pan-y"
                  shadow-intensity="1"
                  style={{ width: "100%", height: "100%" }}
                >
                  {/* Replaces the built-in AR button; AR starts from the labelled button below. */}
                  <span slot="ar-button" />
                </model-viewer>
                {state === "loading" && (
                  <div className={`pointer-events-none absolute inset-0 flex flex-col items-center justify-center ${muted}`}>
                    <CubeIcon className="h-10 w-10 animate-pulse" />
                    <p className="mt-2.5 text-xs">Loading 3D model…</p>
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
          ) : models.usdz && quickLook && posterUrl ? (
            <>
              {/* AR Quick Look needs the link to wrap a single image. */}
              <a rel="ar" href={models.usdz} className="block overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element -- signed, short-lived link */}
                <img src={posterUrl} alt={`View ${title} in AR`} className="aspect-square w-full object-cover" />
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
