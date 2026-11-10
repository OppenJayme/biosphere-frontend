/**
 * Validates collection maintenance forms and URL state for the Cataloging UI.
 * Collection names stay extensible text; this file intentionally defines no fixed-name enum.
 */

import { z } from "zod";

export const COLLECTION_PAGE_LIMIT = 25;

export type CollectionListQuery = {
  search: string;
  page: number;
  limit: typeof COLLECTION_PAGE_LIMIT;
};

export type CollectionFormState = {
  value: string;
  error?: string;
};

export const collectionMutationSchema = z.object({
  collectionName: z
    .string()
    .trim()
    .min(1, "Enter a collection name.")
    .max(255, "Collection names must be 255 characters or fewer."),
});

export type CollectionMutationInput = z.output<typeof collectionMutationSchema>;

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 1_000_000 ? page : 1;
}

export function parseCollectionListQuery(searchParams: SearchParams): CollectionListQuery {
  return {
    search: (firstValue(searchParams.search) ?? "").trim().slice(0, 100),
    page: parsePage(firstValue(searchParams.page)),
    limit: COLLECTION_PAGE_LIMIT,
  };
}

export function collectionListHref(query: CollectionListQuery, page = query.page) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (page > 1) params.set("page", String(page));
  const serialized = params.toString();
  return serialized ? `/specimens/collections?${serialized}` : "/specimens/collections";
}

export function readCollectionForm(formData: FormData) {
  const entry = formData.get("collectionName");
  const value = typeof entry === "string" ? entry : "";
  return { value, result: collectionMutationSchema.safeParse({ collectionName: value }) };
}
