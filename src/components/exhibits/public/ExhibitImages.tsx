"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/layout/LogoMark";
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon } from "@/components/icons";
import type { PublicExhibitMedia } from "@/features/exhibits-qr/types";

type PhotoStatus = "loaded" | "failed";

/** Covers the photo frame while a photo downloads (exhibit photos are often 1 to 3 MB on mobile data). */
function PhotoLoading({ dark }: { dark: boolean }) {
  return (
    <div
      role="status"
      className={`absolute inset-0 flex flex-col items-center justify-center ${dark ? "bg-forest-900/80" : "bg-sage-100"}`}
    >
      <LogoMark className="h-10 w-10 motion-safe:animate-[loading-breathe_1.8s_ease-in-out_infinite]" />
      <p className={`mt-2 text-xs font-semibold ${dark ? "text-white/80" : "text-forest-900"}`}>Loading photo…</p>
      <div className="mt-2 h-1 w-full max-w-32 overflow-hidden rounded-full bg-forest-100">
        <div className="h-full w-2/5 rounded-full bg-forest-700 motion-safe:animate-[loading-bar_1.2s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:animate-pulse" />
      </div>
    </div>
  );
}

/** Carousel over the exhibit's short-lived signed image links (cover first). */
export function ExhibitImages({
  images,
  alt,
  dark,
  aspect = "aspect-4/3",
}: {
  images: PublicExhibitMedia[];
  alt: string;
  dark: boolean;
  aspect?: string;
}) {
  const [index, setIndex] = useState(0);
  // Remembered per photo, so one already downloaded shows straight away when revisited.
  const [photoStatus, setPhotoStatus] = useState<Record<string, PhotoStatus>>({});

  // Start downloading the next photo while the visitor reads, so "Next" is not another wait.
  const nextUrl = images.length > 1 ? images[(index + 1) % images.length].mediaUrl : null;
  useEffect(() => {
    if (!nextUrl) return;
    const preload = new Image();
    preload.decoding = "async";
    preload.src = nextUrl;
  }, [nextUrl]);

  if (images.length === 0) {
    return (
      <div
        className={`flex ${aspect} items-center justify-center rounded-2xl ${
          dark ? "bg-white/5 text-white/30" : "bg-sage-100 text-forest-700/40"
        }`}
      >
        <ImageIcon className="h-10 w-10" />
      </div>
    );
  }

  const image = images[index];
  const status = photoStatus[image.mediaUrl];
  const settle = (url: string, next: PhotoStatus) => setPhotoStatus((current) => ({ ...current, [url]: next }));

  return (
    <figure className="space-y-2">
      <div className={`relative ${aspect} overflow-hidden rounded-2xl bg-black/20`}>
        {/* Signed storage links expire, so next/image optimisation is not used. */}
        {/* The key swaps the element, so the previous photo never lingers while the next one loads. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={image.mediaUrl}
          src={image.mediaUrl}
          alt={image.caption ?? alt}
          decoding="async"
          fetchPriority={index === 0 ? "high" : "auto"}
          // The first photo is server rendered and can finish before React hydrates, when onLoad
          // has already fired; read its state directly so the loader never sticks.
          ref={(element) => {
            if (element?.complete && !photoStatus[image.mediaUrl]) {
              settle(image.mediaUrl, element.naturalWidth > 0 ? "loaded" : "failed");
            }
          }}
          onLoad={() => settle(image.mediaUrl, "loaded")}
          onError={() => settle(image.mediaUrl, "failed")}
          className="h-full w-full object-cover"
        />
        {!status && <PhotoLoading dark={dark} />}
        {status === "failed" && (
          <div
            role="alert"
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2 px-10 text-center text-xs ${
              dark ? "bg-forest-900 text-white/70" : "bg-sage-100 text-zinc-600"
            }`}
          >
            <ImageIcon className="h-6 w-6 opacity-60" />
            This photo could not be loaded. Refresh the page to try again.
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <span className="absolute bottom-3 right-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
              {index + 1}/{images.length}
            </span>
          </>
        )}
      </div>
      {image.caption && (
        <figcaption className={`text-xs ${dark ? "text-white/60" : "text-zinc-500"}`}>{image.caption}</figcaption>
      )}
    </figure>
  );
}
