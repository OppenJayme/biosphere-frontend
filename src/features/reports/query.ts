/** Sanitizes the Reports page's history filters from the URL. */

import {
  REPORT_HISTORY_PAGE_SIZES,
  REPORT_HISTORY_RESULTS,
  REPORT_TYPES,
  type ReportHistoryPageSize,
  type ReportHistoryQuery,
  type ReportHistoryResult,
  type ReportType,
} from "./types";

const DEFAULT_PAGE_SIZE: ReportHistoryPageSize = 10;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(firstValue(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseReportHistoryQuery(
  params: Record<string, string | string[] | undefined>,
): ReportHistoryQuery {
  const type = firstValue(params.historyType);
  const result = firstValue(params.historyResult);
  const limit = positiveInteger(params.historyLimit, DEFAULT_PAGE_SIZE);

  return {
    type: REPORT_TYPES.includes(type as ReportType) ? (type as ReportType) : "",
    result: REPORT_HISTORY_RESULTS.includes(result as ReportHistoryResult)
      ? (result as ReportHistoryResult)
      : "",
    page: Math.min(positiveInteger(params.historyPage, 1), 1_000_000),
    limit: REPORT_HISTORY_PAGE_SIZES.includes(limit as ReportHistoryPageSize)
      ? (limit as ReportHistoryPageSize)
      : DEFAULT_PAGE_SIZE,
  };
}

export function reportHistoryHref(query: ReportHistoryQuery, page = query.page) {
  const params = new URLSearchParams();
  if (query.type) params.set("historyType", query.type);
  if (query.result) params.set("historyResult", query.result);
  if (query.limit !== DEFAULT_PAGE_SIZE) params.set("historyLimit", String(query.limit));
  if (page > 1) params.set("historyPage", String(page));

  const serialized = params.toString();
  return serialized ? `/reports?${serialized}#report-history` : "/reports";
}
