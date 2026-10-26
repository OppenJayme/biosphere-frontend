"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CloseIcon, InfoIcon } from "@/components/icons";
import { exhibitPathFromScan } from "@/features/exhibits-qr/scan";

// The Barcode Detection API is not in TypeScript's DOM library yet.
type DetectedBarcode = { rawValue: string };
type BarcodeDetectorInstance = { detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]> };
type BarcodeDetectorConstructor = {
  new (options: { formats: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?: () => Promise<string[]>;
};

type ScanState = "starting" | "scanning" | "unsupported" | "denied" | "failed" | "notExhibit" | "opening";

/** Reads the QR codes visible in the current video frame. */
type FrameReader = (video: HTMLVideoElement) => Promise<string[]>;

const SCAN_INTERVAL_MS = 300;
// Frames are scaled down before software decoding: enough detail for a label, cheap on phones.
const DECODE_MAX_SIDE = 640;

/** The browser's built-in QR detection (Chrome on Android), when it has one. */
async function nativeReader(): Promise<FrameReader | null> {
  const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  if (!Detector) return null;
  const formats = await Detector.getSupportedFormats?.().catch(() => null);
  if (formats && !formats.includes("qr_code")) return null;
  const detector = new Detector({ formats: ["qr_code"] });
  return async (video) => (await detector.detect(video)).map((code) => code.rawValue);
}

/**
 * Software decoding with jsQR for browsers without QR detection (iPhone Safari, Firefox, desktop).
 * Loaded only when needed, so visitors who never scan do not download it.
 */
async function jsQrReader(): Promise<FrameReader> {
  const { default: jsQR } = await import("jsqr");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  return async (video) => {
    if (!context || !video.videoWidth || !video.videoHeight) return [];
    const scale = Math.min(1, DECODE_MAX_SIDE / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "dontInvert" });
    return code?.data ? [code.data] : [];
  };
}

/**
 * In-page QR scanner for "Scan Another Specimen" (SRS 3.1.5, an optional convenience). The camera
 * is requested only after the visitor taps the button (SRS 3.1.5, REQ-4.13-05) and is released
 * when the dialog closes. Only this site's exhibit links are opened (see `exhibitPathFromScan`).
 * Codes are read with the browser's built-in QR detection where it exists and with jsQR
 * elsewhere, so scanning works in any browser that offers a camera. Without a camera, or when it
 * is refused, the visitor is told to use the phone's own camera app, which opens exhibit labels
 * directly; the printed URL works too (REQ-4.12-12).
 */
export function ScanModal({ dark, onClose }: { dark: boolean; onClose: () => void }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ScanState>("starting");

  useEffect(() => {
    const previous = document.activeElement;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [onClose]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const release = () => stream?.getTracks().forEach((track) => track.stop());

    async function start() {
      // No camera API at all: an old browser, or a page not served over HTTPS.
      if (typeof navigator.mediaDevices?.getUserMedia !== "function") {
        setState("unsupported");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      } catch (error) {
        if (!stopped) setState(error instanceof DOMException && error.name === "NotAllowedError" ? "denied" : "failed");
        return;
      }
      const video = videoRef.current;
      // Closed while the permission prompt was open: the cleanup already ran, so release here.
      if (stopped || !video) {
        release();
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => undefined);

      let read: FrameReader;
      try {
        read = (await nativeReader().catch(() => null)) ?? (await jsQrReader());
      } catch {
        // The decoder could not load (e.g. offline): release the camera and say so.
        release();
        if (!stopped) setState("failed");
        return;
      }
      if (stopped) {
        release();
        return;
      }
      setState("scanning");

      const scan = async () => {
        if (stopped) return;
        try {
          const codes = video.readyState >= 2 ? await read(video) : [];
          for (const code of codes) {
            const path = exhibitPathFromScan(code, window.location.origin);
            if (path) {
              stopped = true;
              setState("opening");
              router.push(path);
              onClose();
              return;
            }
          }
          if (codes.length > 0) setState("notExhibit");
        } catch {
          // A single failed frame is not fatal; keep scanning.
        }
        timer = setTimeout(scan, SCAN_INTERVAL_MS);
      };
      void scan();
    }

    void start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      release();
    };
  }, [router, onClose]);

  const muted = dark ? "text-white/70" : "text-zinc-600";
  const fallback =
    state === "unsupported"
      ? "This browser cannot use the camera here."
      : state === "denied"
        ? "Camera access was not allowed."
        : state === "failed"
          ? "The camera could not be started."
          : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-modal-title"
        tabIndex={-1}
        className={`w-full max-w-sm rounded-t-2xl p-5 focus:outline-none sm:rounded-2xl ${
          dark ? "bg-forest-900 text-white" : "bg-white text-zinc-900"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="scan-modal-title" className="font-serif text-lg font-semibold">
            Scan another specimen
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className={dark ? "text-white/60" : "text-zinc-400"}>
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {fallback ? (
          <div className={`mt-4 space-y-2 text-sm ${muted}`}>
            <p role="status" className={`flex items-start gap-2 rounded-lg px-3.5 py-3 ${dark ? "bg-white/10" : "bg-sage-50"}`}>
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              {fallback}
            </p>
            <p>
              Open your phone&apos;s camera app and point it at the QR code on the specimen label. It opens the
              exhibit page directly. You can also type the web address printed under the code.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} muted playsInline aria-hidden className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-[18%] rounded-xl border-2 border-white/80" />
            </div>
            <p role="status" aria-live="polite" className={`text-sm ${muted}`}>
              {state === "starting"
                ? "Starting the camera…"
                : state === "opening"
                  ? "Opening exhibit…"
                  : state === "notExhibit"
                    ? "That code is not a BioSphere exhibit label. Try the QR code on a museum specimen label."
                    : "Point the camera at the QR code on a specimen label."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
