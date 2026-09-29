/** Shared pieces of the two public exhibit layouts. Only approved public fields are read here. */

import { LeafIcon } from "@/components/icons";
import { sortExhibitMedia, splitFacts, type PublicExhibit } from "@/features/exhibits-qr/types";

export type PublicImage = { src: string; caption: string | null };

export function exhibitImages(exhibit: PublicExhibit): PublicImage[] {
  return sortExhibitMedia(exhibit.media).map((item) => ({ src: item.mediaUrl, caption: item.caption }));
}

const TAXONOMY_ORDER = ["kingdom", "phylum", "class", "order", "family", "genus", "species"] as const;

/** Ranks that have a value, in taxonomic order. */
export function taxonomyRows(exhibit: PublicExhibit) {
  return TAXONOMY_ORDER.flatMap((rank) => {
    const value = exhibit.taxonomy[rank];
    return value ? [{ rank, value }] : [];
  });
}

export function exhibitFacts(exhibit: PublicExhibit) {
  return splitFacts(exhibit.interestingFacts);
}

export function exhibitName(exhibit: PublicExhibit) {
  return exhibit.commonName ?? exhibit.scientificName ?? "Museum specimen";
}

/** Chips under the title: the collection and conservation status, when known. */
export function exhibitTags(exhibit: PublicExhibit) {
  return [exhibit.collection, exhibit.conservationStatus].filter((tag): tag is string => Boolean(tag));
}

export function PhotoPlaceholder({ dark }: { dark: boolean }) {
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 text-xs ${
        dark ? "text-white/50" : "text-zinc-500"
      }`}
    >
      <LeafIcon className="h-8 w-8" />
      Photos coming soon
    </div>
  );
}

/**
 * Every image is rendered (only the current one shown) so all of them load while their
 * short-lived signed URLs are still valid.
 */
export function ImageStack({
  images,
  index,
  alt,
  dark,
}: {
  images: PublicImage[];
  index: number;
  alt: string;
  dark: boolean;
}) {
  if (images.length === 0) return <PhotoPlaceholder dark={dark} />;
  return (
    <>
      {images.map((image, i) => (
        // Signed storage URLs change on every request, so next/image caching would not help.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={image.src}
          src={image.src}
          alt={image.caption ?? alt}
          hidden={i !== index}
          fetchPriority={i === 0 ? "high" : "auto"}
          className="h-full w-full object-cover"
        />
      ))}
    </>
  );
}
