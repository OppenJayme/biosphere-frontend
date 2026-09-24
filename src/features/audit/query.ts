/** Parses URL filters and builds stable links for the live audit-log workspace. */

import {
  AUDIT_PAGE_SIZES,
  AUDIT_RESULTS,
  type AuditLogListQuery,
  type AuditPageSize,
  type AuditResult,
} from "./types";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MUSEUM_TIMEZONE_OFFSET = "+08:00";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function boundedText(value: string | string[] | undefined) {
  return (firstValue(value) ?? "").trim().slice(0, 100);
}

function positiveInteger(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(firstValue(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function dateOnly(value: string | string[] | undefined) {
  const candidate = firstValue(value) ?? "";
  if (!DATE_ONLY_PATTERN.test(candidate)) return "";

  const parsed = new Date(`${candidate}T00:00:00.000Z`);
  return Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== candidate
    ? ""
    : candidate;
}

export function parseAuditLogListQuery(
  params: Record<string, string | string[] | undefined>,
): AuditLogListQuery {
  const resultCandidate = firstValue(params.result);
  const result = AUDIT_RESULTS.includes(resultCandidate as AuditResult)
    ? (resultCandidate as AuditResult)
    : "";
  const limitCandidate = positiveInteger(params.limit, 25);
  const limit = AUDIT_PAGE_SIZES.includes(limitCandidate as AuditPageSize)
    ? (limitCandidate as AuditPageSize)
    : 25;

  return {
    search: boundedText(params.search),
    result,
    module: boundedText(params.module),
    action: boundedText(params.action),
    affectedRecordType: boundedText(params.affectedRecordType),
    fromDate: dateOnly(params.fromDate),
    toDate: dateOnly(params.toDate),
    page: Math.min(positiveInteger(params.page, 1), 1_000_000),
    limit,
  };
}

export function auditLogDateRangeError(query: AuditLogListQuery): string | null {
  if (query.fromDate && query.toDate && query.fromDate > query.toDate) {
    return "The start date must not be after the end date.";
  }
  return null;
}

export function auditLogListHref(query: AuditLogListQuery, page = query.page) {
  const params = new URLSearchParams();

  if (query.search) params.set("search", query.search);
  if (query.result) params.set("result", query.result);
  if (query.module) params.set("module", query.module);
  if (query.action) params.set("action", query.action);
  if (query.affectedRecordType) {
    params.set("affectedRecordType", query.affectedRecordType);
  }
  if (query.fromDate) params.set("fromDate", query.fromDate);
  if (query.toDate) params.set("toDate", query.toDate);
  if (query.limit !== 25) params.set("limit", String(query.limit));
  if (page > 1) params.set("page", String(page));

  const serialized = params.toString();
  return serialized ? `/audit-logs?${serialized}` : "/audit-logs";
}

export function auditDateBounds(query: Pick<AuditLogListQuery, "fromDate" | "toDate">) {
  return {
    from: query.fromDate
      ? `${query.fromDate}T00:00:00.000${MUSEUM_TIMEZONE_OFFSET}`
      : undefined,
    to: query.toDate ? `${query.toDate}T23:59:59.999${MUSEUM_TIMEZONE_OFFSET}` : undefined,
  };
}
