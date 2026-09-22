import { z } from "zod";
import { activeSpecimenLotSchema, storageUnitSchema } from "../specimen-lots/types";

export const SPECIMEN_STATUSES = ["UNCATALOGED", "CATALOGED", "ARCHIVED"] as const;
export const SPECIMEN_GENDERS = ["MALE", "FEMALE", "UNKNOWN", "NOT_APPLICABLE"] as const;

export type SpecimenStatus = (typeof SPECIMEN_STATUSES)[number];

export const SPECIMEN_PAGE_LIMIT = 25;

export const specimenSummarySchema = z.object({
  id: z.uuid(),
  collectionId: z.uuid().nullable(),
  accessionNumber: z.string().nullable(),
  specimenCategory: z.string().nullable(),
  scientificName: z.string().nullable(),
  commonName: z.string().nullable(),
  gender: z.enum(SPECIMEN_GENDERS).nullable(),
  classificationStatus: z.string().nullable(),
  status: z.enum(SPECIMEN_STATUSES),
  publicDisplay: z.boolean(),
  remarks: z.string().nullable(),
  createdBy: z.uuid(),
  updatedBy: z.uuid().nullable(),
  archivedBy: z.uuid().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const specimenPageSchema = z.object({
  items: z.array(specimenSummarySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export const specimenListSchema = z.array(specimenSummarySchema);

export const museumCollectionSchema = z.object({
  id: z.uuid(),
  collectionName: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const collectionPageSchema = z.object({
  items: z.array(museumCollectionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
});

export const specimenTaxonomySchema = z.object({
  specimenId: z.uuid(),
  kingdom: z.string().nullable(),
  phylum: z.string().nullable(),
  class: z.string().nullable(),
  orderName: z.string().nullable(),
  family: z.string().nullable(),
  genus: z.string().nullable(),
  species: z.string().nullable(),
  habitat: z.string().nullable(),
  ecologicalRole: z.string().nullable(),
  conservationStatus: z.string().nullable(),
});

export const specimenProvenanceSchema = z.object({
  specimenId: z.uuid(),
  collector: z.string().nullable(),
  donor: z.string().nullable(),
  collectionDate: z.iso.date().nullable(),
  collectionLocation: z.string().nullable(),
  preservationType: z.string().nullable(),
  preservationMethod: z.string().nullable(),
  updatedAt: z.string().min(1),
});

// Runtime-check the protected backend response before any revision data reaches the UI.
export const specimenRevisionSchema = z.object({
  id: z.uuid(),
  specimenId: z.uuid(),
  changedBy: z.object({
    id: z.uuid(),
    fullName: z.string().min(1),
    role: z.enum(["CURATOR", "DEVELOPER"]),
  }),
  fieldChanged: z.string().min(1),
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
  reason: z.string().nullable(),
  sourceSection: z.string().min(1),
  changedAt: z.iso.datetime({ offset: true }),
});

export const specimenRevisionPageSchema = z.object({
  items: z.array(specimenRevisionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
});

export const specimenTagSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
});

export const attachSpecimenTagResultSchema = z.object({
  tag: specimenTagSchema,
  attached: z.boolean(),
});

export const detachSpecimenTagResultSchema = z.object({
  tagId: z.uuid(),
  detached: z.literal(true),
});

export const specimenMediaSchema = z.object({
  id: z.uuid(),
  specimenId: z.uuid(),
  storagePath: z.string().min(1),
  displayOrder: z.number().int().nonnegative(),
  caption: z.string().nullable(),
  isCover: z.boolean(),
  createdAt: z.string().min(1),
});

export const specimenMediaSignedUrlSchema = z.object({
  mediaId: z.uuid(),
  signedUrl: z
    .url()
    .refine((value) => value.startsWith("https://"), "Media URLs must use HTTPS."),
  expiresIn: z.number().int().positive(),
});

export const replaceSpecimenMediaResultSchema = z.object({
  media: specimenMediaSchema,
  previousStorageCleanupPending: z.boolean(),
});

export const removeSpecimenMediaResultSchema = z.object({
  id: z.uuid(),
  removed: z.literal(true),
  storageCleanupPending: z.boolean(),
});

export const specimenDetailSchema = z.object({
  specimen: specimenSummarySchema,
  collection: museumCollectionSchema.nullable(),
  taxonomy: specimenTaxonomySchema.nullable(),
  provenance: specimenProvenanceSchema.nullable(),
  activeLots: z.array(
    activeSpecimenLotSchema.extend({
      storageUnit: storageUnitSchema,
    }),
  ),
  lotOverview: z.object({
    activeLotCount: z.number().int().nonnegative(),
    totalQuantity: z.number().int().nonnegative(),
  }),
  media: z.array(specimenMediaSchema),
  tags: z.array(specimenTagSchema),
});

export type SpecimenSummary = z.infer<typeof specimenSummarySchema>;
export type SpecimenPage = z.infer<typeof specimenPageSchema>;
export type SpecimenDetail = z.infer<typeof specimenDetailSchema>;
export type MuseumCollection = z.infer<typeof museumCollectionSchema>;
export type SpecimenTaxonomy = z.infer<typeof specimenTaxonomySchema>;
export type SpecimenProvenance = z.infer<typeof specimenProvenanceSchema>;
export type SpecimenRevision = z.infer<typeof specimenRevisionSchema>;
export type SpecimenRevisionPage = z.infer<typeof specimenRevisionPageSchema>;
export type SpecimenTag = z.infer<typeof specimenTagSchema>;
export type SpecimenMedia = z.infer<typeof specimenMediaSchema>;
export type SpecimenMediaSignedUrl = z.infer<typeof specimenMediaSignedUrlSchema>;

export type SpecimenListQuery = {
  search: string;
  status: SpecimenStatus | null;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;

  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 1_000_000 ? page : 1;
}

export function parseSpecimenListQuery(searchParams: SearchParams): SpecimenListQuery {
  const rawSearch = firstValue(searchParams.search) ?? "";
  const search = rawSearch.trim().slice(0, 100);
  const rawStatus = firstValue(searchParams.status);
  const status = SPECIMEN_STATUSES.includes(rawStatus as SpecimenStatus)
    ? (rawStatus as SpecimenStatus)
    : null;

  return {
    search,
    status,
    page: parsePage(firstValue(searchParams.page)),
  };
}

export function specimenListHref(query: SpecimenListQuery, page = query.page) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (page > 1) params.set("page", String(page));

  const serialized = params.toString();
  return serialized ? `/specimens?${serialized}` : "/specimens";
}
