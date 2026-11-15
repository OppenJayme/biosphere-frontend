/**
 * The one image viewer for BioSphere, so every viewable photo opens, closes, switches and loads
 * the same way:
 *
 * - ImageFrame: a photo inside a fixed frame. It shows a soft skeleton (and the previous photo,
 *   blurred) until the new one has loaded, then fades or slides it in. No blank flash.
 * - ImageCarousel: previous/next over several photos, built on ImageFrame.
 * - ZoomableImage: a single photo. Both open the full-screen ImageViewer when clicked.
 * - ImageViewer: the full-screen lightbox. The backdrop fades in while the photo scales up from
 *   the clicked thumbnail's position; closing reverses it.
 *
 * Motion is defined by the viewer-* keyframes in globals.css. Under prefers-reduced-motion every
 * movement falls back to a plain fade.
 *
 * Photos are short-lived signed storage links, so a plain <img> is used: next/image would cache
 * a private image past its expiry.
 */

"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, ExpandIcon, ImageIcon } from "@/components/icons";

export type ViewerImage = { src: string; alt: string; caption?: string | null };

type Direction = "next" | "prev" | "none";

const ENTER: Record<Direction, string> = {
  next: "motion-safe:animate-[viewer-slide-next_250ms_ease-out] motion-reduce:animate-[viewer-fade-in_250ms_ease-out]",
  prev: "motion-safe:animate-[viewer-slide-prev_250ms_ease-out] motion-reduce:animate-[viewer-fade-in_250ms_ease-out]",
  none: "animate-[viewer-fade-in_250ms_ease-out]",
};

const CLOSE_MS = 180;

/**
 * One photo in a positioned frame with a fixed size or aspect ratio. Remembers which photos have
 * loaded, so one already downloaded shows straight away when revisited.
 */
export function ImageFrame({
  image,
  direction = "none",
  fit = "cover",
  dark = false,
  priority = false,
  failedText = "This photo could not be loaded. Reload to request a fresh link.",
  onError,
}: {
  image: ViewerImage;
  /** Which way the photo arrives when it replaces another one. */
  direction?: Direction;
  fit?: "cover" | "contain";
  dark?: boolean;
  /** The first photo of a page: fetched with high priority. */
  priority?: boolean;
  failedText?: string;
  onError?: () => void;
}) {
  const [status, setStatus] = useState<Record<string, "loaded" | "failed">>({});
  // The photo shown before this one stays underneath, blurred, as the placeholder while this loads.
  const [shown, setShown] = useState<{ src: string; previous: string | null }>({ src: image.src, previous: null });
  if (shown.src !== image.src) {
    setShown({ src: image.src, previous: status[shown.src] === "loaded" ? shown.src : null });
  }

  const current = status[image.src];
  const settle = (src: string, value: "loaded" | "failed") => {
    setStatus((all) => (all[src] === value ? all : { ...all, [src]: value }));
    if (value === "failed") onError?.();
  };
  const fitClass = fit === "cover" ? "object-cover" : "object-contain";

  return (
    <>
      {!current && (
        <div
          role="status"
          aria-label="Loading photo"
          className={`absolute inset-0 overflow-hidden ${dark ? "bg-white/10" : "bg-sage-100"}`}
        >
          <div
            className={`absolute inset-0 motion-safe:animate-[viewer-shimmer_1.4s_ease-in-out_infinite] motion-reduce:animate-pulse ${
              dark
                ? "bg-linear-to-r from-transparent via-white/10 to-transparent"
                : "bg-linear-to-r from-transparent via-white/70 to-transparent"
            }`}
          />
        </div>
      )}
      {shown.previous && !current && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shown.previous}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 h-full w-full scale-105 opacity-60 blur-md ${fitClass}`}
        />
      )}
      {/* The key replaces the element, so each photo runs its own entrance once it has loaded. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={image.src}
        src={image.src}
        alt={image.alt}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        referrerPolicy="no-referrer"
        // A server-rendered photo can finish before React hydrates, after onLoad already fired;
        // read its state directly so the placeholder never sticks.
        ref={(element) => {
          if (element?.complete && !status[image.src]) {
            settle(image.src, element.naturalWidth > 0 ? "loaded" : "failed");
          }
        }}
        onLoad={() => settle(image.src, "loaded")}
        onError={() => settle(image.src, "failed")}
        className={`relative h-full w-full ${fitClass} ${current === "loaded" ? ENTER[direction] : "opacity-0"}`}
      />
      {current === "failed" && (
        <div
          role="alert"
          className={`absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center text-xs ${
            dark ? "bg-forest-900 text-white/70" : "bg-sage-100 text-zinc-600"
          }`}
        >
          <ImageIcon className="h-6 w-6 opacity-60" />
          {failedText}
        </div>
      )}
    </>
  );
}

/** Where the viewer's opening animation starts: the centre of the clicked thumbnail. */
type Origin = { x: number; y: number } | null;

function originOf(element: HTMLElement | null): Origin {
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/** Full-screen lightbox. Mount it to open; it calls `onClose` after its closing animation. */
export function ImageViewer({
  images,
  index,
  onIndexChange,
  onClose,
  origin = null,
}: {
  images: ViewerImage[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  origin?: Origin;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);
  const [direction, setDirection] = useState<Direction>("none");
  const image = images[Math.min(index, images.length - 1)];
  const many = images.length > 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, []);

  // Play the closing animation, then let the owner unmount the viewer.
  const close = useCallback(() => setClosing(true), []);
  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(onClose, CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  const step = useCallback(
    (by: 1 | -1) => {
      setDirection(by === 1 ? "next" : "prev");
      onIndexChange((index + by + images.length) % images.length);
    },
    [index, images.length, onIndexChange],
  );

  const controlClasses =
    "flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  return (
    <dialog
      ref={dialogRef}
      aria-label={many ? `Photo ${index + 1} of ${images.length}` : "Photo"}
      data-closing={closing || undefined}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onKeyDown={(event) => {
        if (!many) return;
        if (event.key === "ArrowRight") step(1);
        if (event.key === "ArrowLeft") step(-1);
      }}
      // A click on the dark area around the photo closes the viewer.
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-white backdrop:bg-black/85 backdrop:animate-[viewer-fade-in_200ms_ease-out] data-[closing]:backdrop:animate-[viewer-fade-out_180ms_ease-in_forwards]"
    >
      <div
        style={origin ? { transformOrigin: `${origin.x}px ${origin.y}px` } : undefined}
        className={`pointer-events-none flex h-full w-full flex-col ${
          closing
            ? "motion-safe:animate-[viewer-zoom-out_180ms_ease-in_forwards] motion-reduce:animate-[viewer-fade-out_180ms_ease-in_forwards]"
            : "motion-safe:animate-[viewer-zoom-in_200ms_ease-out] motion-reduce:animate-[viewer-fade-in_200ms_ease-out]"
        }`}
      >
        <div className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3">
          <p aria-live="polite" className="text-sm tabular-nums text-white/80">
            {many ? `${index + 1} / ${images.length}` : ""}
          </p>
          <button type="button" onClick={close} aria-label="Close photo" className={controlClasses}>
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-16">
          <div className="pointer-events-auto relative h-full w-full">
            <ImageFrame image={image} direction={direction} fit="contain" dark />
          </div>
          {many && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className={`pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2 sm:left-4 ${controlClasses}`}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className={`pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2 sm:right-4 ${controlClasses}`}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        <p className="pointer-events-auto min-h-12 px-6 py-3 text-center text-sm text-white/85">{image.caption ?? ""}</p>
      </div>
    </dialog>
  );
}

/** Button laid over a photo that opens it in the viewer. */
function OpenViewerButton({ onOpen, label }: { onOpen: (origin: Origin) => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-haspopup="dialog"
      onClick={(event) => onOpen(originOf(event.currentTarget))}
      className="group absolute inset-0 cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-forest-700"
    >
      <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
        <ExpandIcon className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}

/** A single photo in its frame that opens the viewer when clicked. Place it in a positioned frame. */
export function ZoomableImage({
  image,
  fit = "cover",
  failedText,
  onError,
}: {
  image: ViewerImage;
  fit?: "cover" | "contain";
  failedText?: string;
  onError?: () => void;
}) {
  const [origin, setOrigin] = useState<Origin | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  return (
    <>
      <ImageFrame
        image={image}
        fit={fit}
        failedText={failedText}
        onError={() => {
          setFailed(true);
          onError?.();
        }}
      />
      {!failed && <OpenViewerButton label={`View larger: ${image.alt}`} onOpen={setOrigin} />}
      {origin !== undefined && (
        <ImageViewer
          images={[image]}
          index={0}
          onIndexChange={() => {}}
          origin={origin}
          onClose={() => setOrigin(undefined)}
        />
      )}
    </>
  );
}

/** Previous/next over several photos; clicking the photo opens the viewer at that photo. */
export function ImageCarousel({
  images,
  aspect = "aspect-4/3",
  rounded = "rounded-lg",
  dark = false,
  priority = false,
  controlsClassName = "h-7 w-7",
  children,
}: {
  images: ViewerImage[];
  aspect?: string;
  rounded?: string;
  dark?: boolean;
  /** The first photo is the page's main image. */
  priority?: boolean;
  /** Size of the previous/next buttons. */
  controlsClassName?: string;
  /** Rendered under the frame with the current photo, e.g. a caption. */
  children?: (image: ViewerImage) => ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>("none");
  const [origin, setOrigin] = useState<Origin | undefined>(undefined);
  const current = Math.min(index, images.length - 1);
  const image = images[current];
  const many = images.length > 1;

  // Start downloading the next photo while this one is read, so "Next" is not another wait.
  const nextSrc = many ? images[(current + 1) % images.length].src : null;
  useEffect(() => {
    if (!nextSrc) return;
    const preload = new Image();
    preload.decoding = "async";
    preload.referrerPolicy = "no-referrer";
    preload.src = nextSrc;
  }, [nextSrc]);

  function step(by: 1 | -1) {
    setDirection(by === 1 ? "next" : "prev");
    setIndex((current + by + images.length) % images.length);
  }

  const control = `absolute top-1/2 z-10 flex ${controlsClassName} -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`;

  return (
    <>
      <div className={`relative ${aspect} overflow-hidden ${rounded} ${dark ? "bg-black/20" : "bg-sage-100"}`}>
        <ImageFrame
          image={image}
          direction={direction}
          dark={dark}
          priority={priority && current === 0}
          failedText="This photo could not be loaded. Refresh the page to try again."
        />
        <OpenViewerButton label={`View larger: ${image.alt}`} onOpen={setOrigin} />
        {many && (
          <>
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className={`${control} left-2`}>
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className={`${control} right-2`}>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <span className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[0.6875rem] font-medium text-white tabular-nums">
              {current + 1}/{images.length}
            </span>
          </>
        )}
      </div>
      {children?.(image)}
      {origin !== undefined && (
        <ImageViewer
          images={images}
          index={current}
          onIndexChange={(next) => {
            setDirection("none");
            setIndex(next);
          }}
          origin={origin}
          onClose={() => setOrigin(undefined)}
        />
      )}
    </>
  );
}
