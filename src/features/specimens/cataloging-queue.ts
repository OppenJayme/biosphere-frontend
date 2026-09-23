/**
 * URL-state contract for the live Cataloging queue.
 * Queue status stays fixed to Uncataloged; readiness is not inferred from unapproved rules.
 */

import type { SpecimenListQuery } from "./types";

export type CatalogingQueueQuery = {
  search: string;
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

export function parseCatalogingQueueQuery(searchParams: SearchParams): CatalogingQueueQuery {
  return {
    search: (firstValue(searchParams.search) ?? "").trim().slice(0, 100),
    page: parsePage(firstValue(searchParams.page)),
  };
}

export function toSpecimenListQuery(query: CatalogingQueueQuery): SpecimenListQuery {
  return {
    search: query.search,
    status: "UNCATALOGED",
    collectionId: null,
    specimenCategory: "",
    gender: null,
    publicDisplay: null,
    sortBy: "updatedAt",
    sortDirection: "desc",
    page: query.page,
  };
}

export function catalogingQueueHref(query: CatalogingQueueQuery, page = query.page) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (page > 1) params.set("page", String(page));
  const serialized = params.toString();
  return serialized ? `/cataloging?${serialized}` : "/cataloging";
}
