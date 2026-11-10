/** Safe URL parsing for the bounded FAQ knowledge list. */

import {
  DEFAULT_FAQ_PAGE_SIZE,
  FAQ_PAGE_SIZES,
  FAQ_STATUSES,
  type FaqListQuery,
  type FaqPageSize,
  type FaqStatus,
} from "./types";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 && page <= 1_000_000 ? page : 1;
}

function parseStatus(value: string | undefined): FaqStatus | "" {
  return FAQ_STATUSES.includes(value as FaqStatus) ? (value as FaqStatus) : "";
}

function parseLimit(value: string | undefined): FaqPageSize {
  const size = Number(value);
  return FAQ_PAGE_SIZES.includes(size as FaqPageSize) ? (size as FaqPageSize) : DEFAULT_FAQ_PAGE_SIZE;
}

export function parseFaqListQuery(searchParams: SearchParams): FaqListQuery {
  return {
    status: parseStatus(firstValue(searchParams.status)),
    category: (firstValue(searchParams.category) ?? "").trim().slice(0, 100),
    search: (firstValue(searchParams.search) ?? "").trim().slice(0, 200),
    page: parsePage(firstValue(searchParams.page)),
    limit: parseLimit(firstValue(searchParams.limit)),
  };
}

export function faqKnowledgeHref(query: FaqListQuery, page = query.page) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.category) params.set("category", query.category);
  if (query.search) params.set("search", query.search);
  if (query.limit !== DEFAULT_FAQ_PAGE_SIZE) params.set("limit", String(query.limit));
  if (page > 1) params.set("page", String(page));
  const serialized = params.toString();
  return serialized ? `/faq-knowledge?${serialized}` : "/faq-knowledge";
}
