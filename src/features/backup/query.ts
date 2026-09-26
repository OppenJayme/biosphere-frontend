/** Sanitizes backup-history URL filters and converts museum dates to API bounds. */

import {
  BACKUP_PAGE_SIZES,
  BACKUP_STATUSES,
  type BackupHistoryListQuery,
  type BackupPageSize,
  type BackupStatus,
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

export function parseBackupHistoryQuery(
  params: Record<string, string | string[] | undefined>,
): BackupHistoryListQuery {
  const statusCandidate = firstValue(params.status);
  const status = BACKUP_STATUSES.includes(statusCandidate as BackupStatus)
    ? (statusCandidate as BackupStatus)
    : "";
  const limitCandidate = positiveInteger(params.limit, 25);
  const limit = BACKUP_PAGE_SIZES.includes(limitCandidate as BackupPageSize)
    ? (limitCandidate as BackupPageSize)
    : 25;

  return {
    search: boundedText(params.search),
    status,
    backupType: boundedText(params.backupType),
    fromDate: dateOnly(params.fromDate),
    toDate: dateOnly(params.toDate),
    page: Math.min(positiveInteger(params.page, 1), 1_000_000),
    limit,
  };
}

export function backupDateRangeError(query: BackupHistoryListQuery) {
  return query.fromDate && query.toDate && query.fromDate > query.toDate
    ? "The start date must not be after the end date."
    : null;
}

export function backupDateBounds(
  query: Pick<BackupHistoryListQuery, "fromDate" | "toDate">,
) {
  return {
    from: query.fromDate
      ? `${query.fromDate}T00:00:00.000${MUSEUM_TIMEZONE_OFFSET}`
      : undefined,
    to: query.toDate
      ? `${query.toDate}T23:59:59.999${MUSEUM_TIMEZONE_OFFSET}`
      : undefined,
  };
}

export function backupHistoryHref(
  query: BackupHistoryListQuery,
  page = query.page,
) {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);
  if (query.backupType) params.set("backupType", query.backupType);
  if (query.fromDate) params.set("fromDate", query.fromDate);
  if (query.toDate) params.set("toDate", query.toDate);
  if (query.limit !== 25) params.set("limit", String(query.limit));
  if (page > 1) params.set("page", String(page));

  const serialized = params.toString();
  return serialized ? `/backup-history?${serialized}` : "/backup-history";
}
