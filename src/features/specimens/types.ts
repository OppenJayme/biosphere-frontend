import { z } from "zod";

export const SPECIMEN_STATUSES = ["UNCATALOGED", "CATALOGED", "ARCHIVED"] as const;

export type SpecimenStatus = (typeof SPECIMEN_STATUSES)[number];

export const SPECIMEN_PAGE_LIMIT = 25;

export const specimenSummarySchema = z.object({
  id: z.uuid(),
  collectionId: z.uuid().nullable(),
  accessionNumber: z.string().nullable(),
  specimenCategory: z.string().nullable(),
  scientificName: z.string().nullable(),
  commonName: z.string().nullable(),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN", "NOT_APPLICABLE"]).nullable(),
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

export type SpecimenSummary = z.infer<typeof specimenSummarySchema>;
export type SpecimenPage = z.infer<typeof specimenPageSchema>;

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
