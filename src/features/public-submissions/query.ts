/** Safe URL state for the curator Public Website page (tab, status filter, search, date range, selection). */

import { INQUIRY_STATUSES, type InquiryStatus } from "../inquiries/types";
import { VISIT_REQUEST_STATUSES, type VisitRequestStatus } from "../visit-requests/types";

export const PUBLIC_WEBSITE_PATH = "/public-website";
export const SEARCH_MAX = 100;

export type WebsiteTab = "inquiries" | "visits";

/**
 * YYYY-MM-DD date filters (REQ-4.8-05, REQ-4.9-08). `submitted*` is the submission date in museum time;
 * `visitDate*` (visit requests only) is the approved date, or any preferred date while none is approved.
 * An empty string means "not set".
 */
export type DateFilters = {
  submittedFrom: string;
  submittedTo: string;
  visitDateFrom: string;
  visitDateTo: string;
};

export type PublicWebsiteQuery =
  | ({ tab: "inquiries"; status: InquiryStatus | ""; search: string } & DateFilters)
  | ({ tab: "visits"; status: VisitRequestStatus | ""; search: string } & DateFilters);

/** Plain-object view state the client binds into each curator action so it returns to the same list. */
export type ReturnQuery = { tab: WebsiteTab; status: string; search: string } & Partial<DateFilters>;

type SearchParams = Record<string, string | string[] | undefined>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const DATE_KEYS = ["submittedFrom", "submittedTo", "visitDateFrom", "visitDateTo"] as const;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** A real calendar date in YYYY-MM-DD form, or "" (so a hand-edited URL never reaches the API as a 400). */
function parseDate(value: string | string[] | undefined) {
  const candidate = (firstValue(value) ?? "").trim();
  if (!DATE_PATTERN.test(candidate)) return "";
  return new Date(`${candidate}T00:00:00.000Z`).toISOString().slice(0, 10) === candidate ? candidate : "";
}

/** Puts a reversed range back in order, since the API rejects a range that ends before it starts. */
function orderedRange(from: string, to: string): [string, string] {
  return from && to && from > to ? [to, from] : [from, to];
}

function parseDateFilters(searchParams: SearchParams, visits: boolean): DateFilters {
  const [submittedFrom, submittedTo] = orderedRange(
    parseDate(searchParams.submittedFrom),
    parseDate(searchParams.submittedTo),
  );
  const [visitDateFrom, visitDateTo] = visits
    ? orderedRange(parseDate(searchParams.visitDateFrom), parseDate(searchParams.visitDateTo))
    : ["", ""];
  return { submittedFrom, submittedTo, visitDateFrom, visitDateTo };
}

export function parsePublicWebsiteQuery(searchParams: SearchParams): PublicWebsiteQuery {
  const search = (firstValue(searchParams.search) ?? "").trim().slice(0, SEARCH_MAX);
  const status = firstValue(searchParams.status) ?? "";

  if (firstValue(searchParams.tab) === "visits") {
    const known = VISIT_REQUEST_STATUSES.includes(status as VisitRequestStatus);
    return {
      tab: "visits",
      status: known ? (status as VisitRequestStatus) : "",
      search,
      ...parseDateFilters(searchParams, true),
    };
  }

  const known = INQUIRY_STATUSES.includes(status as InquiryStatus);
  return {
    tab: "inquiries",
    status: known ? (status as InquiryStatus) : "",
    search,
    ...parseDateFilters(searchParams, false),
  };
}

/** True when any list filter (status, search, or a date) is set. */
export function hasListFilters(query: PublicWebsiteQuery) {
  return Boolean(query.status || query.search || DATE_KEYS.some((key) => query[key]));
}

/** The query's list filters as a stable string, for React keys that reset state when filters change. */
export function listFilterKey(query: PublicWebsiteQuery) {
  return [query.tab, query.status, query.search, ...DATE_KEYS.map((key) => query[key])].join("|");
}

export function parseSelectedId(searchParams: SearchParams) {
  const value = firstValue(searchParams.selected);
  return value && UUID_PATTERN.test(value) ? value.toLowerCase() : undefined;
}

export function publicWebsiteHref(
  query: Pick<PublicWebsiteQuery, "tab"> &
    Partial<Pick<PublicWebsiteQuery, "status" | "search">> &
    Partial<DateFilters>,
  extras: { selected?: string; notice?: string; email?: string } = {},
) {
  const params = new URLSearchParams();
  if (query.tab === "visits") params.set("tab", "visits");
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  for (const key of DATE_KEYS) {
    if (key.startsWith("visitDate") && query.tab !== "visits") continue;
    const value = query[key];
    if (value) params.set(key, value);
  }
  if (extras.selected) params.set("selected", extras.selected);
  if (extras.notice) params.set("notice", extras.notice);
  if (extras.email) params.set("email", extras.email);
  const serialized = params.toString();
  return serialized ? `${PUBLIC_WEBSITE_PATH}?${serialized}` : PUBLIC_WEBSITE_PATH;
}
