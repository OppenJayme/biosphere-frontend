import "server-only";
import { apiFetch } from "@/lib/api-client";
import {
  collectionPageSchema,
  SPECIMEN_PAGE_LIMIT,
  specimenDetailSchema,
  specimenPageSchema,
  specimenProvenanceSchema,
  specimenSummarySchema,
  specimenTaxonomySchema,
  type MuseumCollection,
  type SpecimenListQuery,
} from "./types";
import type { SpecimenMutationInput } from "./form";
import type { ProvenanceMutationInput } from "./provenance-form";
import type { TaxonomyMutationInput } from "./taxonomy-form";

const COLLECTION_PAGE_LIMIT = 100;

async function getCollectionPage(page: number) {
  const response = await apiFetch<unknown>(
    `/collections?page=${page}&limit=${COLLECTION_PAGE_LIMIT}`,
    { method: "GET", cache: "no-store" },
  );
  const result = collectionPageSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid collection response.");
  }

  return result.data;
}

export async function listCollections(): Promise<MuseumCollection[]> {
  const firstPage = await getCollectionPage(1);
  const pageCount = Math.ceil(firstPage.total / firstPage.limit);
  if (pageCount <= 1) return firstPage.items;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => getCollectionPage(index + 2)),
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.items);
}

export async function searchSpecimens(query: SpecimenListQuery) {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(SPECIMEN_PAGE_LIMIT),
    sortBy: "updatedAt",
    sortDirection: "desc",
  });

  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);

  const response = await apiFetch<unknown>(`/specimens/search?${params}`, {
    method: "GET",
    cache: "no-store",
  });
  const result = specimenPageSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid specimen catalog response.");
  }

  return result.data;
}

export async function getSpecimenDetails(id: string) {
  const response = await apiFetch<unknown>(`/specimens/${encodeURIComponent(id)}/details`, {
    method: "GET",
    cache: "no-store",
  });
  const result = specimenDetailSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid specimen detail response.");
  }

  return result.data;
}

export async function createSpecimen(input: SpecimenMutationInput) {
  const response = await apiFetch<unknown>("/specimens", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const result = specimenSummarySchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid created specimen response.");
  }

  return result.data;
}

export async function updateSpecimen(id: string, input: SpecimenMutationInput) {
  const response = await apiFetch<unknown>(`/specimens/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  const result = specimenSummarySchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid updated specimen response.");
  }

  return result.data;
}

async function mutateTaxonomy(
  specimenId: string,
  method: "POST" | "PATCH",
  input: TaxonomyMutationInput,
) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/taxonomy`,
    { method, body: JSON.stringify(input) },
  );
  const result = specimenTaxonomySchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid specimen taxonomy response.");
  }

  return result.data;
}

export function createSpecimenTaxonomy(specimenId: string, input: TaxonomyMutationInput) {
  return mutateTaxonomy(specimenId, "POST", input);
}

export function updateSpecimenTaxonomy(specimenId: string, input: TaxonomyMutationInput) {
  return mutateTaxonomy(specimenId, "PATCH", input);
}

async function mutateProvenance(
  specimenId: string,
  method: "POST" | "PATCH",
  input: ProvenanceMutationInput,
) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/provenance`,
    { method, body: JSON.stringify(input) },
  );
  const result = specimenProvenanceSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid specimen provenance response.");
  }

  return result.data;
}

export function createSpecimenProvenance(
  specimenId: string,
  input: ProvenanceMutationInput,
) {
  return mutateProvenance(specimenId, "POST", input);
}

export function updateSpecimenProvenance(
  specimenId: string,
  input: ProvenanceMutationInput,
) {
  return mutateProvenance(specimenId, "PATCH", input);
}
