/** Presentation helpers for report-history rows. */

import {
  EXHIBIT_STATUS_OPTIONS,
  INQUIRY_STATUS_OPTIONS,
  REPORT_FILTER_LABELS,
  SPECIMEN_STATUS_OPTIONS,
  VISIT_STATUS_OPTIONS,
  type ReportHistoryItem,
} from "./types";

const ENUM_LABELS = new Map<string, string>(
  [
    ...SPECIMEN_STATUS_OPTIONS,
    ...INQUIRY_STATUS_OPTIONS,
    ...VISIT_STATUS_OPTIONS,
    ...EXHIBIT_STATUS_OPTIONS,
  ].map(([value, label]) => [value, label]),
);

function filterValue(key: string, value: unknown, storageLabels: ReadonlyMap<string, string>) {
  if (key === "storageUnitId" && typeof value === "string") {
    return storageLabels.get(value) ?? "Unknown location";
  }
  // Remarks are audited only as `true`; their text is never stored.
  if (key === "remarks") return "Included";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return ENUM_LABELS.get(value) ?? value;
  if (typeof value === "number") return String(value);
  return null;
}

/** "September 2026 · Status: Pending · Family: Papilionidae" */
export function describeReportParameters(
  item: Pick<ReportHistoryItem, "periodLabel" | "filters">,
  storageLabels: ReadonlyMap<string, string> = new Map(),
) {
  const parts = item.periodLabel ? [item.periodLabel] : [];
  for (const [key, value] of Object.entries(item.filters)) {
    const shown = filterValue(key, value, storageLabels);
    if (shown === null) continue;
    parts.push(`${REPORT_FILTER_LABELS[key] ?? key}: ${shown}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "No filters";
}

export function formatReportTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      }).format(date);
}
