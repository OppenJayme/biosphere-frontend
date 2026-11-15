"use client";

import { ImageIcon } from "@/components/icons";
import { ImageCarousel } from "@/components/ui/ImageViewer";
import type { PublicExhibitMedia } from "@/features/exhibits-qr/types";

/**
 * Carousel over the exhibit's short-lived signed image links (cover first). The shared image
 * viewer supplies the loading placeholder (exhibit photos are often 1 to 3 MB on mobile data),
 * the transitions between photos, the preload of the next one and the full-screen view.
 */
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

  return (
    <figure className="space-y-2">
      <ImageCarousel
        images={images.map((image) => ({ src: image.mediaUrl, alt: image.caption ?? alt, caption: image.caption }))}
        aspect={aspect}
        rounded="rounded-2xl"
        dark={dark}
        priority
        controlsClassName="h-8 w-8"
      >
        {(image) =>
          image.caption ? (
            <figcaption className={`text-xs ${dark ? "text-white/60" : "text-zinc-500"}`}>{image.caption}</figcaption>
          ) : null
        }
      </ImageCarousel>
    </figure>
  );
}
