/** Safe URL parsing for the bounded FAQ knowledge list. */

import {
  FAQ_PAGE_LIMIT,
  FAQ_STATUSES,
  type FaqListQuery,
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

export function parseFaqListQuery(searchParams: SearchParams): FaqListQuery {
  return {
    status: parseStatus(firstValue(searchParams.status)),
    category: (firstValue(searchParams.category) ?? "").trim().slice(0, 100),
    page: parsePage(firstValue(searchParams.page)),
    limit: FAQ_PAGE_LIMIT,
  };
}

export function faqKnowledgeHref(query: FaqListQuery, page = query.page) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.category) params.set("category", query.category);
  if (page > 1) params.set("page", String(page));
  const serialized = params.toString();
  return serialized ? `/faq-knowledge?${serialized}` : "/faq-knowledge";
}
