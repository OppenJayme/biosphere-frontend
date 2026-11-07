import { z } from "zod";
import { activeSpecimenLotSchema, storageUnitSchema } from "../specimen-lots/types";

export const SPECIMEN_STATUSES = ["UNCATALOGED", "CATALOGED", "ARCHIVED"] as const;
export const SPECIMEN_GENDERS = ["MALE", "FEMALE", "UNKNOWN", "NOT_APPLICABLE"] as const;
export const SPECIMEN_SORT_FIELDS = [
  "updatedAt",
  "createdAt",
  "accessionNumber",
  "scientificName",
  "commonName",
  "status",
  "specimenCategory",
  "family",
] as const;
export const SORT_DIRECTIONS = ["asc", "desc"] as const;

export type SpecimenStatus = (typeof SPECIMEN_STATUSES)[number];
export type SpecimenGender = (typeof SPECIMEN_GENDERS)[number];
export type SpecimenSortField = (typeof SPECIMEN_SORT_FIELDS)[number];
export type SortDirection = (typeof SORT_DIRECTIONS)[number];
export type SpecimenPageSize = (typeof SPECIMEN_PAGE_SIZES)[number];

export const SPECIMEN_PAGE_LIMIT = 25;
/** Rows-per-page choices on the catalog and Cataloging tables; other callers keep SPECIMEN_PAGE_LIMIT. */
export const SPECIMEN_PAGE_SIZES = [10, 25, 50] as const;
export const DEFAULT_SPECIMEN_PAGE_SIZE = 10;

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

/** Server-assessed restoration; never infer a successful mutation from a generic specimen response. */
export const specimenRestoreResultSchema = specimenSummarySchema.extend({
  restored: z.boolean(),
  missingRequirements: z.array(z.string()),
});

export const DUPLICATE_MATCH_FIELDS = [
  "ACCESSION_NUMBER",
  "SCIENTIFIC_NAME",
  "COMMON_NAME",
  "COLLECTOR",
  "DONOR",
  "COLLECTION_LOCATION",
  "COLLECTION_DATE",
] as const;
export const DUPLICATE_CONFIDENCES = ["HIGH", "MEDIUM"] as const;

export type DuplicateMatchField = (typeof DUPLICATE_MATCH_FIELDS)[number];
export type DuplicateConfidence = (typeof DUPLICATE_CONFIDENCES)[number];

/** One existing record that may duplicate the checked values (warning only, REQ-4.4-21). */
export const possibleDuplicateSchema = z.object({
  specimenId: z.uuid(),
  accessionNumber: z.string().nullable(),
  scientificName: z.string().nullable(),
  commonName: z.string().nullable(),
  status: z.enum(SPECIMEN_STATUSES),
  confidence: z.enum(DUPLICATE_CONFIDENCES),
  matchedFields: z.array(z.enum(DUPLICATE_MATCH_FIELDS)),
  differingFields: z.array(z.enum(DUPLICATE_MATCH_FIELDS)),
  message: z.string().min(1),
});

const duplicateCheckFields = {
  possibleDuplicates: z.array(possibleDuplicateSchema),
  /** False when the lookup could not run: an empty list then does NOT mean "no duplicates". */
  duplicateCheckAvailable: z.boolean(),
};

/** POST /specimens/duplicate-check and GET /specimens/:id/possible-duplicates. */
export const specimenDuplicateCheckResultSchema = z.object(duplicateCheckFields);

/** POST /specimens: the created record plus the post-save duplicate warning result. */
export const specimenCreateResultSchema = specimenSummarySchema.extend(duplicateCheckFields);

/** Catalog search row: the specimen plus the columns the curator table shows. */
export const specimenSearchItemSchema = specimenSummarySchema.extend({
  family: z.string().nullable(),
  collector: z.string().nullable(),
  totalQuantity: z.number().int().nonnegative(),
  conditionClasses: z.array(z.string()),
  storageUnits: z.array(
    z.object({
      id: z.uuid(),
      label: z.string(),
      unitType: z.string(),
      pathLabel: z.string(),
    }),
  ),
});

export const specimenPageSchema = z.object({
  items: z.array(specimenSearchItemSchema),
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

/** GET /specimens/:id/catalog-readiness: each catalog-completion rule and whether it passes. */
export const catalogReadinessSchema = z.object({
  specimenId: z.uuid(),
  currentStatus: z.enum(SPECIMEN_STATUSES),
  requirementsMet: z.boolean(),
  /** True only when requirements pass and the record is currently Uncataloged. */
  canComplete: z.boolean(),
  checks: z.array(
    z.object({ key: z.string().min(1), label: z.string().min(1), passed: z.boolean() }),
  ),
  /** Readable labels of the failed checks. */
  missingRequirements: z.array(z.string()),
});

/** 400 body from PATCH /specimens/:id/complete-cataloging when requirements are missing. */
export const catalogRejectionSchema = z.object({
  message: z.unknown(),
  missingRequirements: z.array(z.string().min(1)).min(1),
});

export const specimenTagSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(100),
});

export const attachSpecimenTagResultSchema = z.object({
  tag: specimenTagSchema,
  attached: z.boolean(),
});

/** PATCH /specimens/:id/tags/:tagId: swap one attached tag for another in one transaction. */
export const changeSpecimenTagResultSchema = z.object({
  tag: specimenTagSchema,
  previousTagId: z.uuid(),
  changed: z.boolean(),
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
    // Why the record has no active quantity; older backends omit it.
    zeroQuantityReason: z
      .object({
        adjustmentType: z.string().nullable(),
        reason: z.string().nullable(),
        recordedAt: z.string(),
      })
      .nullable()
      .optional(),
  }),
  media: z.array(specimenMediaSchema),
  tags: z.array(specimenTagSchema),
});

export type SpecimenSummary = z.infer<typeof specimenSummarySchema>;
export type PossibleDuplicate = z.infer<typeof possibleDuplicateSchema>;
export type SpecimenDuplicateCheckResult = z.infer<typeof specimenDuplicateCheckResultSchema>;
export type SpecimenCreateResult = z.infer<typeof specimenCreateResultSchema>;
export type SpecimenPage = z.infer<typeof specimenPageSchema>;
export type SpecimenSearchItem = z.infer<typeof specimenSearchItemSchema>;
export type SpecimenDetail = z.infer<typeof specimenDetailSchema>;
export type MuseumCollection = z.infer<typeof museumCollectionSchema>;
export type CollectionPage = z.infer<typeof collectionPageSchema>;
export type SpecimenTaxonomy = z.infer<typeof specimenTaxonomySchema>;
export type SpecimenProvenance = z.infer<typeof specimenProvenanceSchema>;
export type SpecimenRevision = z.infer<typeof specimenRevisionSchema>;
export type SpecimenRevisionPage = z.infer<typeof specimenRevisionPageSchema>;
export type SpecimenTag = z.infer<typeof specimenTagSchema>;
export type CatalogReadiness = z.infer<typeof catalogReadinessSchema>;
export type SpecimenMedia = z.infer<typeof specimenMediaSchema>;
export type SpecimenMediaSignedUrl = z.infer<typeof specimenMediaSignedUrlSchema>;

export type SpecimenListQuery = {
  search: string;
  status: SpecimenStatus | null;
  collectionId: string | null;
  specimenCategory: string;
  gender: SpecimenGender | null;
  publicDisplay: boolean | null;
  sortBy: SpecimenSortField;
  sortDirection: SortDirection;
  page: number;
  limit?: number;
} & Partial<SpecimenAdvancedFilters>;

/**
 * Narrower catalog filters (REQ-4.7-02). Optional on SpecimenListQuery so
 * callers that only need the basic filters can leave them out.
 */
export type SpecimenAdvancedFilters = {
  classificationStatus: string;
  kingdom: string;
  phylum: string;
  taxonClass: string;
  taxonOrder: string;
  family: string;
  genus: string;
  species: string;
  tag: string;
  conditionClass: string;
  storageUnitId: string | null;
  includeDescendantUnits: boolean;
  /** Inclusive museum-time dates, YYYY-MM-DD. */
  createdFrom: string;
  createdTo: string;
};

export const SPECIMEN_TEXT_FILTERS = [
  "classificationStatus",
  "kingdom",
  "phylum",
  "taxonClass",
  "taxonOrder",
  "family",
  "genus",
  "species",
  "tag",
  "conditionClass",
] as const;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MUSEUM_UTC_OFFSET = "+08:00";

function dateOnly(value: string | undefined) {
  if (!value || !DATE_ONLY_PATTERN.test(value)) return "";
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value ? "" : value;
}

function boundedText(value: string | undefined) {
  return (value ?? "").trim().slice(0, 100);
}

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;

  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 1_000_000 ? page : 1;
}

/** Unknown sizes fall back to the default, so a hand-edited URL cannot request other page sizes. */
export function parseSpecimenPageSize(value: string | undefined): SpecimenPageSize {
  const size = Number(value);
  return SPECIMEN_PAGE_SIZES.includes(size as SpecimenPageSize)
    ? (size as SpecimenPageSize)
    : DEFAULT_SPECIMEN_PAGE_SIZE;
}

export function parseSpecimenListQuery(searchParams: SearchParams): SpecimenListQuery {
  const rawSearch = firstValue(searchParams.search) ?? "";
  const search = rawSearch.trim().slice(0, 100);
  const rawStatus = firstValue(searchParams.status);
  // The "Show archived specimens" checkbox submits archived=1; it takes precedence
  // over the status select because the backend filters on one status at a time.
  const status =
    firstValue(searchParams.archived) === "1"
      ? "ARCHIVED"
      : SPECIMEN_STATUSES.includes(rawStatus as SpecimenStatus)
        ? (rawStatus as SpecimenStatus)
        : null;
  const rawCollectionId = firstValue(searchParams.collectionId);
  const collectionId = z.uuid().safeParse(rawCollectionId).success
    ? (rawCollectionId ?? null)
    : null;
  const specimenCategory = (firstValue(searchParams.specimenCategory) ?? "")
    .trim()
    .slice(0, 100);
  const rawGender = firstValue(searchParams.gender);
  const gender = SPECIMEN_GENDERS.includes(rawGender as SpecimenGender)
    ? (rawGender as SpecimenGender)
    : null;
  const rawPublicDisplay = firstValue(searchParams.publicDisplay);
  const publicDisplay =
    rawPublicDisplay === "true" ? true : rawPublicDisplay === "false" ? false : null;
  const rawSortBy = firstValue(searchParams.sortBy);
  const sortBy = SPECIMEN_SORT_FIELDS.includes(rawSortBy as SpecimenSortField)
    ? (rawSortBy as SpecimenSortField)
    : "updatedAt";
  const rawSortDirection = firstValue(searchParams.sortDirection);
  const sortDirection = SORT_DIRECTIONS.includes(rawSortDirection as SortDirection)
    ? (rawSortDirection as SortDirection)
    : "desc";

  const rawStorageUnitId = firstValue(searchParams.storageUnitId);
  const storageUnitId = z.uuid().safeParse(rawStorageUnitId).success
    ? (rawStorageUnitId ?? null)
    : null;

  return {
    search,
    status,
    collectionId,
    specimenCategory,
    gender,
    publicDisplay,
    sortBy,
    sortDirection,
    page: parsePage(firstValue(searchParams.page)),
    limit: parseSpecimenPageSize(firstValue(searchParams.limit)),
    classificationStatus: boundedText(firstValue(searchParams.classificationStatus)),
    kingdom: boundedText(firstValue(searchParams.kingdom)),
    phylum: boundedText(firstValue(searchParams.phylum)),
    taxonClass: boundedText(firstValue(searchParams.taxonClass)),
    taxonOrder: boundedText(firstValue(searchParams.taxonOrder)),
    family: boundedText(firstValue(searchParams.family)),
    genus: boundedText(firstValue(searchParams.genus)),
    species: boundedText(firstValue(searchParams.species)),
    tag: boundedText(firstValue(searchParams.tag)),
    conditionClass: boundedText(firstValue(searchParams.conditionClass)),
    storageUnitId,
    // Sub-locations are included unless the curator opts out.
    includeDescendantUnits: firstValue(searchParams.includeDescendantUnits) !== "false",
    createdFrom: dateOnly(firstValue(searchParams.createdFrom)),
    createdTo: dateOnly(firstValue(searchParams.createdTo)),
  };
}

/** True when any narrower filter is set, so the toolbar opens that section. */
export function hasAdvancedSpecimenFilters(query: SpecimenListQuery) {
  return (
    SPECIMEN_TEXT_FILTERS.some((key) => Boolean(query[key])) ||
    Boolean(query.storageUnitId) ||
    Boolean(query.createdFrom) ||
    Boolean(query.createdTo)
  );
}

export function specimenDateRangeError(query: SpecimenListQuery) {
  return query.createdFrom && query.createdTo && query.createdFrom > query.createdTo
    ? "The Date added start must not be after its end."
    : null;
}

/** Museum-time day bounds for the backend's ISO 8601 date-added filters. */
export function specimenCreatedBounds(query: Pick<SpecimenListQuery, "createdFrom" | "createdTo">) {
  return {
    from: query.createdFrom ? `${query.createdFrom}T00:00:00.000${MUSEUM_UTC_OFFSET}` : undefined,
    to: query.createdTo ? `${query.createdTo}T23:59:59.999${MUSEUM_UTC_OFFSET}` : undefined,
  };
}

export function specimenListHref(query: SpecimenListQuery, page = query.page) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.collectionId) params.set("collectionId", query.collectionId);
  if (query.specimenCategory) params.set("specimenCategory", query.specimenCategory);
  if (query.gender) params.set("gender", query.gender);
  if (query.publicDisplay !== null) {
    params.set("publicDisplay", String(query.publicDisplay));
  }
  for (const key of SPECIMEN_TEXT_FILTERS) {
    const value = query[key];
    if (value) params.set(key, value);
  }
  if (query.storageUnitId) {
    params.set("storageUnitId", query.storageUnitId);
    if (query.includeDescendantUnits === false) params.set("includeDescendantUnits", "false");
  }
  if (query.createdFrom) params.set("createdFrom", query.createdFrom);
  if (query.createdTo) params.set("createdTo", query.createdTo);
  if (query.sortBy !== "updatedAt") params.set("sortBy", query.sortBy);
  if (query.sortDirection !== "desc") params.set("sortDirection", query.sortDirection);
  if (query.limit && query.limit !== DEFAULT_SPECIMEN_PAGE_SIZE) params.set("limit", String(query.limit));
  if (page > 1) params.set("page", String(page));

  const serialized = params.toString();
  return serialized ? `/specimens?${serialized}` : "/specimens";
}
