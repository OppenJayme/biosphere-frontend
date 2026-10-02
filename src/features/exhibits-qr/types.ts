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

/** Curator media record. `mediaUrl` is the private storage path, not a viewable URL. */
export const exhibitMediaSchema = z.object({
  id: z.uuid(),
  exhibitId: z.uuid(),
  mediaUrl: z.string(),
  displayOrder: z.number().int(),
  caption: z.string().nullable(),
  isCover: z.boolean(),
});

export const exhibitSchema = z.object({
  id: z.uuid(),
  specimenId: z.uuid(),
  createdBy: z.string(),
  publicSlug: z.string().min(1),
  interestingFacts: z.string().nullable(),
  publicDescription: z.string().nullable(),
  distribution: z.string().nullable(),
  diet: z.string().nullable(),
  layoutType: z.string().nullable(),
  status: z.enum(EXHIBIT_STATUSES),
  publishedAt: z.string().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  media: z.array(exhibitMediaSchema).optional(),
});

export const exhibitListSchema = z.array(exhibitSchema);

/** Only the fields the dashboard's QR readiness summary needs. */
export const exhibitSummaryListSchema = z.array(
  exhibitSchema.pick({ id: true, specimenId: true, publicSlug: true, status: true, updatedAt: true }),
);

export type Exhibit = z.infer<typeof exhibitSchema>;
export type ExhibitSummary = z.infer<typeof exhibitSummaryListSchema>[number];
export type ExhibitMedia = z.infer<typeof exhibitMediaSchema>;

/**
 * The exhibit endpoints return only the specimen id, so the curator page looks up the
 * specimen's names separately. Null when that lookup failed.
 */
export type ExhibitSpecimenInfo = {
  commonName: string | null;
  scientificName: string | null;
  accessionNumber: string | null;
};

export type ExhibitRow = Exhibit & { specimen: ExhibitSpecimenInfo | null };

const nullableText = z.string().nullable();

export const publicExhibitMediaSchema = z.object({
  mediaUrl: z.string().min(1),
  displayOrder: z.number().int(),
  caption: nullableText,
  isCover: z.boolean(),
});

/** Public QR page content: only curator-approved fields (REQ-4.12-08). */
export const publicExhibitSchema = z.object({
  publicSlug: z.string().min(1),
  interestingFacts: nullableText,
  publicDescription: nullableText,
  distribution: nullableText,
  diet: nullableText,
  layoutType: nullableText,
  media: z.array(publicExhibitMediaSchema),
});

export type PublicExhibit = z.infer<typeof publicExhibitSchema>;
export type PublicExhibitMedia = z.infer<typeof publicExhibitMediaSchema>;

/**
 * The public endpoint does not return the specimen name, so the page title comes from the
 * curator-chosen URL ending: "giant-forest-beetle" -> "Giant Forest Beetle".
 */
export function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Display name for an exhibit row, falling back to the URL ending when the specimen is unknown. */
export function exhibitDisplayName(row: Pick<ExhibitRow, "publicSlug" | "specimen">) {
  return row.specimen?.commonName ?? row.specimen?.scientificName ?? titleFromSlug(row.publicSlug);
}

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
