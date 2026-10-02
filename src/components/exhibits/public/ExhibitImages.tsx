"use client";

import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ImageIcon } from "@/components/icons";
import type { PublicExhibitMedia } from "@/features/exhibits-qr/types";

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
  return (
    <figure className="space-y-2">
      <div className={`relative ${aspect} overflow-hidden rounded-2xl bg-black/20`}>
        {/* Signed storage links expire, so next/image optimisation is not used. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.mediaUrl} alt={image.caption ?? alt} className="h-full w-full object-cover" />
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
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
