/** Pure mapping from the backend dashboard summary to the dashboard sections. */

import type {
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

export function buildCollectionByType(summary: DashboardSummary): CollectionByType {
  const total = summary.specimens.byCategory.reduce((sum, item) => sum + item.count, 0);
  const segments = summary.specimens.byCategory.map((item, index) => ({
    label: item.category,
    value: item.count,
    pct: total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));
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
