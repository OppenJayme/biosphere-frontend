import "server-only";
import { apiFetch } from "@/lib/api-client";
import {
  collectionPageSchema,
  attachSpecimenTagResultSchema,
  detachSpecimenTagResultSchema,
  removeSpecimenMediaResultSchema,
  replaceSpecimenMediaResultSchema,
  SPECIMEN_PAGE_LIMIT,
  specimenDetailSchema,
  specimenListSchema,
  specimenPageSchema,
  specimenProvenanceSchema,
  specimenRevisionPageSchema,
  specimenMediaSchema,
  specimenMediaSignedUrlSchema,
  specimenSummarySchema,
  specimenTaxonomySchema,
  specimenTagSchema,
  type MuseumCollection,
  type SpecimenListQuery,
  type SpecimenSummary,
} from "./types";
import type { SpecimenMutationInput } from "./form";
import type { ProvenanceMutationInput } from "./provenance-form";
import {
  REVISION_PAGE_LIMIT,
  type SpecimenRevisionQuery,
} from "./revision-history";
import type { TaxonomyMutationInput } from "./taxonomy-form";
import type { AttachSpecimenTagInput } from "./tag-form";
import type { SpecimenMediaMetadataInput } from "./media-form";

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

// Real backend route: GET /specimens (unfiltered, unpaginated — see
// SpecimensController.findAll). Distinct from searchSpecimens() below, which
// targets a paginated /specimens/search route the backend doesn't expose yet.
export async function listSpecimens(): Promise<SpecimenSummary[]> {
  const response = await apiFetch<unknown>("/specimens", {
    method: "GET",
    cache: "no-store",
  });
  const result = specimenListSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid specimen list response.");
  }

  return result.data;
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

/** Fetch only the core record when an aggregate detail response is unnecessary. */
export async function getSpecimen(id: string) {
  const response = await apiFetch<unknown>(`/specimens/${encodeURIComponent(id)}`, {
    method: "GET",
    cache: "no-store",
  });
  const result = specimenSummarySchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid specimen response.");
  }

  return result.data;
}

/** Read a bounded, validated page of immutable catalog revision records. */
export async function getSpecimenRevisionHistory(
  specimenId: string,
  query: SpecimenRevisionQuery,
) {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(REVISION_PAGE_LIMIT),
  });
  if (query.fieldChanged) params.set("fieldChanged", query.fieldChanged);
  if (query.sourceSection) params.set("sourceSection", query.sourceSection);

  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/revisions?${params}`,
    { method: "GET", cache: "no-store" },
  );
  const result = specimenRevisionPageSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid specimen revision-history response.");
  }

  return result.data;
}

/** Read the tags currently attached to one specimen. */
export async function listSpecimenTags(specimenId: string) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/tags`,
    { method: "GET", cache: "no-store" },
  );
  const result = specimenTagSchema.array().safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid specimen-tag response.");
  }

  return result.data;
}

/** Search the reusable vocabulary without treating its extensible values as an enum. */
export async function searchAvailableTags(search: string) {
  const params = new URLSearchParams({ limit: "25" });
  if (search) params.set("search", search);
  const response = await apiFetch<unknown>(`/tags?${params}`, {
    method: "GET",
    cache: "no-store",
  });
  const result = specimenTagSchema.array().safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid tag-vocabulary response.");
  }

  return result.data;
}

/** Create or reuse a vocabulary tag and attach it to the requested specimen. */
export async function attachSpecimenTag(
  specimenId: string,
  input: AttachSpecimenTagInput,
) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/tags`,
    { method: "POST", body: JSON.stringify(input) },
  );
  const result = attachSpecimenTagResultSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid attached-tag response.");
  }

  return result.data;
}

/** Detach one specimen relationship; the shared vocabulary tag is retained. */
export async function detachSpecimenTag(specimenId: string, tagId: string) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/tags/${encodeURIComponent(tagId)}`,
    { method: "DELETE" },
  );
  const result = detachSpecimenTagResultSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid detached-tag response.");
  }

  return result.data;
}

/** Read stable media metadata without exposing a permanent public object URL. */
export async function listSpecimenMedia(specimenId: string) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/media`,
    { method: "GET", cache: "no-store" },
  );
  const result = specimenMediaSchema.array().safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid specimen-media response.");
  }

  return result.data;
}

/** Request a short-lived private image URL after backend ownership checks. */
export async function getSpecimenMediaSignedUrl(specimenId: string, mediaId: string) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/media/${encodeURIComponent(mediaId)}/signed-url`,
    { method: "GET", cache: "no-store" },
  );
  const result = specimenMediaSignedUrlSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid specimen-media URL response.");
  }

  return result.data;
}

/** Forward an already validated multipart upload to the protected backend. */
export async function createSpecimenMedia(specimenId: string, formData: FormData) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/media`,
    { method: "POST", body: formData },
  );
  const result = specimenMediaSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid uploaded-media response.");
  }

  return result.data;
}

export async function updateSpecimenMedia(
  specimenId: string,
  mediaId: string,
  input: SpecimenMediaMetadataInput,
) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/media/${encodeURIComponent(mediaId)}`,
    { method: "PATCH", body: JSON.stringify(input) },
  );
  const result = specimenMediaSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid updated-media response.");
  }

  return result.data;
}

export async function setSpecimenMediaCover(specimenId: string, mediaId: string) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/media/${encodeURIComponent(mediaId)}/cover`,
    { method: "PATCH", body: JSON.stringify({}) },
  );
  const result = specimenMediaSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid cover-media response.");
  }

  return result.data;
}

export async function removeSpecimenMedia(specimenId: string, mediaId: string) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/media/${encodeURIComponent(mediaId)}`,
    { method: "DELETE" },
  );
  const result = removeSpecimenMediaResultSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid removed-media response.");
  }

  return result.data;
}

/** Replace only the private object while preserving its metadata relationship. */
export async function replaceSpecimenMediaFile(
  specimenId: string,
  mediaId: string,
  formData: FormData,
) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/media/${encodeURIComponent(mediaId)}/file`,
    { method: "PUT", body: formData },
  );
  const result = replaceSpecimenMediaResultSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid replacement-media response.");
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

/** Archive a catalog record through the backend's preserve-history operation. */
export async function archiveSpecimen(id: string) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(id)}/archive`,
    { method: "PATCH" },
  );
  const result = specimenSummarySchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid archived specimen response.");
  }

  return result.data;
}

/** Change public eligibility only; this does not publish an exhibit or internal record. */
export async function setSpecimenPublicDisplay(id: string, publicDisplay: boolean) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(id)}/public-display`,
    { method: "PATCH", body: JSON.stringify({ publicDisplay }) },
  );
  const result = specimenSummarySchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid public-display response.");
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
