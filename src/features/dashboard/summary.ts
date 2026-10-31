/** Pure mapping from the backend dashboard summary to the dashboard sections. */

import type {
  AttentionItem,
  CatalogingTrendPoint,
  CollectionByType,
  DashboardSpecimenRow,
  DashboardStat,
  DashboardSummary,
  QueueItem,
  RecentSpecimenRow,
  SpecimenCatalogStatus,
} from "./types";

const CATEGORY_COLORS = [
  "#c0392b",
  "#c4922c",
  "#2f6fa8",
  "#2c5c42",
  "#1f3a5f",
  "#4a8f7b",
  "#9aa39a",
  "#8e5b9f",
  "#b0665a",
  "#5a7a9a",
];

const MONTH_LABEL = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });

function countLabel(count: number, singular: string, plural: string) {
  return `${count.toLocaleString()} ${count === 1 ? singular : plural}`;
}

// REQ-4.3-01/02: status counts and pending requests; each card opens its
// filtered list (SRS §4.3.2).
export function buildStats(summary: DashboardSummary): DashboardStat[] {
  const { specimens, submissions } = summary;
  const pending = submissions.pendingInquiries + submissions.pendingVisitRequests;

  return [
    {
      key: "total",
      label: "Total Specimens",
      value: specimens.total.toLocaleString(),
      note: specimens.addedThisMonth > 0 ? `+${specimens.addedThisMonth} this month` : "No new records this month",
      tone: "positive",
      icon: "specimen",
      href: "/specimens",
    },
    {
      key: "uncataloged",
      label: "Uncataloged",
      value: specimens.byStatus.UNCATALOGED.toLocaleString(),
      note: "Awaiting cataloging",
      tone: specimens.byStatus.UNCATALOGED > 0 ? "warning" : "positive",
      icon: "draft",
      href: "/specimens?status=UNCATALOGED",
    },
    {
      key: "cataloged",
      label: "Cataloged",
      value: specimens.byStatus.CATALOGED.toLocaleString(),
      note: "Cataloging complete",
      tone: "positive",
      icon: "chart",
      href: "/specimens?status=CATALOGED",
    },
    {
      key: "archived",
      label: "Archived",
      value: specimens.byStatus.ARCHIVED.toLocaleString(),
      note: "Kept for history",
      tone: "neutral",
      icon: "log",
      href: "/specimens?status=ARCHIVED",
    },
    {
      key: "pending",
      label: "Pending Requests",
      value: pending.toLocaleString(),
      note: `${countLabel(submissions.pendingInquiries, "inquiry", "inquiries")} · ${countLabel(submissions.pendingVisitRequests, "visit request", "visit requests")}`,
      tone: pending > 0 ? "warning" : "positive",
      icon: "mail",
      href:
        submissions.pendingInquiries === 0 && submissions.pendingVisitRequests > 0
          ? "/public-website?tab=visits&status=PENDING"
          : "/public-website?status=PENDING",
    },
    {
      key: "duplicates",
      label: "Possible Duplicates",
      value: specimens.possibleDuplicates.toLocaleString(),
      note: "Same scientific name & category",
      tone: specimens.possibleDuplicates > 0 ? "danger" : "positive",
      icon: "lock",
      // Sorting by name puts matching records next to each other.
      href: "/specimens?sortBy=scientificName&sortDirection=asc",
    },
  ];
}

/**
 * Plain-language to-do list for the dashboard: only items with something waiting,
 * each linking to the page where the curator acts on it.
 */
export function buildAttention(summary: DashboardSummary): AttentionItem[] {
  const { specimens, submissions, exhibits } = summary;
  const items: AttentionItem[] = [
    {
      key: "inquiries",
      count: submissions.pendingInquiries,
      text: countLabel(submissions.pendingInquiries, "general inquiry is", "general inquiries are") + " waiting for a reply",
      action: "Review",
      href: "/public-website?status=PENDING",
    },
    {
      key: "visits",
      count: submissions.pendingVisitRequests,
      text: countLabel(submissions.pendingVisitRequests, "visit request needs", "visit requests need") + " a schedule decision",
      action: "Review",
      href: "/public-website?tab=visits&status=PENDING",
    },
    {
      key: "uncataloged",
      count: specimens.byStatus.UNCATALOGED,
      text: countLabel(specimens.byStatus.UNCATALOGED, "specimen is", "specimens are") + " waiting to be cataloged",
      action: "Continue",
      href: "/cataloging",
    },
    {
      key: "duplicates",
      count: specimens.possibleDuplicates,
      text:
        countLabel(specimens.possibleDuplicates, "record looks", "records look") +
        " like a possible duplicate (same scientific name and category)",
      action: "Check",
      // Sorting by name puts matching records next to each other.
      href: "/specimens?sortBy=scientificName&sortDirection=asc",
    },
    {
      key: "qr",
      count: exhibits.publishedUnavailable,
      text:
        countLabel(exhibits.publishedUnavailable, "published QR exhibit shows", "published QR exhibits show") +
        " nothing to visitors because the specimen is no longer public",
      action: "Fix",
      href: "/exhibits",
    },
  ];
  return items.filter((item) => item.count > 0);
}

/** Legend size before smaller categories are grouped, so the card stays short and colours stay distinct. */
const MAX_COLLECTION_SEGMENTS = 8;
const OTHER_SEGMENT_COLOR = "#a1a1aa";

export function buildCollectionByType(summary: DashboardSummary): CollectionByType {
  const total = summary.specimens.byCategory.reduce((sum, item) => sum + item.count, 0);
  const pct = (count: number) => (total > 0 ? Math.round((count / total) * 1000) / 10 : 0);
  const sorted = [...summary.specimens.byCategory].sort((a, b) => b.count - a.count);
  const grouped = sorted.length > MAX_COLLECTION_SEGMENTS;
  const shown = grouped ? sorted.slice(0, MAX_COLLECTION_SEGMENTS - 1) : sorted;

  const segments = shown.map((item, index) => ({
    label: item.category,
    value: item.count,
    pct: pct(item.count),
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));
  if (grouped) {
    const rest = sorted.slice(MAX_COLLECTION_SEGMENTS - 1);
    const count = rest.reduce((sum, item) => sum + item.count, 0);
    segments.push({ label: `Others (${rest.length})`, value: count, pct: pct(count), color: OTHER_SEGMENT_COLOR });
  }
  return { segments, total };
}

export function buildCatalogingTrend(summary: DashboardSummary): CatalogingTrendPoint[] {
  return summary.specimens.addedByMonth.map(({ month, count }) => {
    const [year, monthNumber] = month.split("-").map(Number);
    return { month: MONTH_LABEL.format(new Date(Date.UTC(year, monthNumber - 1, 1))), value: count };
  });
}

export function toQueueItem(row: DashboardSpecimenRow): QueueItem {
  return {
    id: row.id,
    accessionNo: row.accessionNumber ?? "Unassigned",
    species: row.scientificName ?? row.commonName ?? "Unidentified specimen",
    category: row.specimenCategory,
  };
}

export function toRecentRow(row: DashboardSpecimenRow): RecentSpecimenRow {
  return {
    id: row.id,
    accessionNo: row.accessionNumber ?? "Unassigned",
    commonName: row.commonName ?? row.scientificName ?? "Unnamed specimen",
    category: row.specimenCategory,
    storageLocation: row.storageLocation,
    condition: row.condition,
    catalogStatus: toCatalogStatusLabel(row.status),
    publicStatus: row.publicDisplay ? "Public" : "Restricted",
    lastUpdated: row.updatedAt,
  };
}

function toCatalogStatusLabel(status: DashboardSpecimenRow["status"]): SpecimenCatalogStatus {
  if (status === "CATALOGED") return "Cataloged";
  if (status === "ARCHIVED") return "Archived";
  return "Uncataloged";
}
