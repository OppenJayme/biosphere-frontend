/** Runtime contracts for curator QR exhibit management and the public QR exhibit page. */

import { z } from "zod";

export const EXHIBIT_STATUSES = ["UNPUBLISHED", "PUBLISHED", "DISABLED"] as const;
export type ExhibitStatus = (typeof EXHIBIT_STATUSES)[number];

export const EXHIBIT_STATUS_LABELS: Record<ExhibitStatus, string> = {
  UNPUBLISHED: "Unpublished",
  PUBLISHED: "Published",
  DISABLED: "Disabled",
};

/**
 * The backend stores `layoutType` as free text. The public page renders "card-grid" as the card
 * layout and everything else (including null and older values such as "standard") as the mobile
 * accordion, which is the SRS 3.1.5 default of clear expandable sections.
 */
export const EXHIBIT_LAYOUTS = ["mobile-accordion", "card-grid"] as const;
export type ExhibitLayout = (typeof EXHIBIT_LAYOUTS)[number];

export function exhibitLayout(layoutType: string | null): ExhibitLayout {
  return layoutType === "card-grid" ? "card-grid" : "mobile-accordion";
}

export const EXHIBIT_LAYOUT_LABELS: Record<ExhibitLayout, string> = {
  "mobile-accordion": "Mobile accordion",
  "card-grid": "Card grid",
};

export const exhibitMediaSchema = z.object({
  id: z.uuid(),
  exhibitId: z.uuid(),
  mediaUrl: z.string(),
  previewUrl: z.string().nullable().optional(),
  displayOrder: z.number().int(),
  caption: z.string().nullable(),
  isCover: z.boolean(),
});

export const exhibitSchema = z.object({
  id: z.uuid(),
  specimenId: z.uuid(),
  publicSlug: z.string().min(1),
  publicUrl: z.string().nullable(),
  interestingFacts: z.string().nullable(),
  publicDescription: z.string().nullable(),
  distribution: z.string().nullable(),
  diet: z.string().nullable(),
  layoutType: z.string().nullable(),
  status: z.enum(EXHIBIT_STATUSES),
  arEnabled: z.boolean(),
  arAssetCount: z.number().int().nonnegative(),
  specimen: z.object({
    commonName: z.string().nullable(),
    scientificName: z.string().nullable(),
    accessionNumber: z.string().nullable(),
  }),
  publishedAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  media: z.array(exhibitMediaSchema).optional(),
});

export const exhibitListSchema = z.array(exhibitSchema);

export type Exhibit = z.infer<typeof exhibitSchema>;
export type ExhibitMedia = z.infer<typeof exhibitMediaSchema>;

const nullableText = z.string().nullable();

/** Public QR page content: only curator-approved fields (REQ-4.12-08, REQ-4.13-07). */
export const publicExhibitSchema = z.object({
  publicSlug: z.string().min(1),
  commonName: nullableText,
  scientificName: nullableText,
  collection: nullableText,
  taxonomy: z.object({
    kingdom: nullableText,
    phylum: nullableText,
    class: nullableText,
    order: nullableText,
    family: nullableText,
    genus: nullableText,
    species: nullableText,
  }),
  habitat: nullableText,
  ecologicalRole: nullableText,
  conservationStatus: nullableText,
  interestingFacts: nullableText,
  publicDescription: nullableText,
  distribution: nullableText,
  diet: nullableText,
  layoutType: nullableText,
  media: z.array(
    z.object({
      mediaUrl: z.string().min(1),
      displayOrder: z.number().int(),
      caption: nullableText,
      isCover: z.boolean(),
    }),
  ),
  ar: z.object({
    available: z.boolean(),
    models: z.array(z.object({ format: z.enum(["glb", "usdz"]), url: z.string().min(1) })),
  }),
});

export type PublicExhibit = z.infer<typeof publicExhibitSchema>;
export type PublicArModel = PublicExhibit["ar"]["models"][number];

export type ExhibitListQuery = {
  status: ExhibitStatus | "";
  ar: "on" | "off" | "";
  search: string;
};

/** Cover image first, then curator display order (the order the public carousel uses). */
export function sortExhibitMedia<T extends { isCover: boolean; displayOrder: number }>(media: T[]) {
  return [...media].sort(
    (a, b) => Number(b.isCover) - Number(a.isCover) || a.displayOrder - b.displayOrder,
  );
}

/** Curator-entered facts are one per line; blank lines are ignored. */
export function splitFacts(interestingFacts: string | null) {
  return (interestingFacts ?? "")
    .split(/\r?\n/)
    .map((fact) => fact.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
}
