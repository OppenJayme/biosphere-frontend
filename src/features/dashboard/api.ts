import "server-only";
import { ApiError } from "@/lib/api-client";
import { listAuditLogs } from "../audit/api";
import type { AuditLogEntry } from "../audit/types";
import { listInquiries } from "../inquiries/api";
import type { Inquiry } from "../inquiries/types";
import { listActiveLots } from "../specimen-lots/api";
import type { SpecimenLot } from "../specimen-lots/types";
import { listSpecimens } from "../specimens/api";
import type { SpecimenSummary } from "../specimens/types";
import { getStorageOccupancySummary, listStorageLocations } from "../storage-locations/api";
import type { StorageOccupancySummary, StorageUnit } from "../storage-locations/types";
import { listVisitRequests } from "../visit-requests/api";
import type { VisitRequest } from "../visit-requests/types";
import type {
  ActivityItem,
  CatalogingTrendPoint,
  CollectionByType,
  DashboardData,
  DashboardStat,
  QueueItem,
  RecentSpecimenRow,
  SectionResult,
  SpecimenCatalogStatus,
  StorageHealthItem,
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

const RECENT_SPECIMENS_LIMIT = 7;
const CATALOGING_QUEUE_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 6;
const STORAGE_HEALTH_LIMIT = 6;
const TREND_MONTHS = 12;

export async function getDashboardData(): Promise<DashboardData> {
  const [specimensResult, inquiriesResult, visitRequestsResult, auditResult, occupancyResult, storageUnitsResult] =
    await Promise.allSettled([
      listSpecimens(),
      listInquiries(),
      listVisitRequests(),
      listAuditLogs({ page: 1, limit: RECENT_ACTIVITY_LIMIT }),
      getStorageOccupancySummary(),
      listStorageLocations(),
    ]);

  // An expired/invalid session fails every endpoint the same way — surface
  // that as a redirect-worthy error instead of six separate "unavailable"
  // panels. Any other failure (a single endpoint down) degrades per-section.
  const settledResults = [
    specimensResult,
    inquiriesResult,
    visitRequestsResult,
    auditResult,
    occupancyResult,
    storageUnitsResult,
  ];
  const unauthorized = settledResults.find(
    (result) => result.status === "rejected" && result.reason instanceof ApiError && result.reason.status === 401,
  );
  if (unauthorized && unauthorized.status === "rejected") {
    throw unauthorized.reason;
  }

  const specimens = specimensResult.status === "fulfilled" ? specimensResult.value : null;

  const stats = buildStats(specimens, inquiriesResult, visitRequestsResult);
  const collectionByType: SectionResult<CollectionByType> = specimens
    ? { status: "ok", data: buildCollectionByType(specimens) }
    : { status: "error" };
  const catalogingTrend: SectionResult<CatalogingTrendPoint[]> = specimens
    ? { status: "ok", data: buildCatalogingTrend(specimens) }
    : { status: "error" };
  const catalogingQueue: SectionResult<QueueItem[]> = specimens
    ? { status: "ok", data: buildCatalogingQueue(specimens) }
    : { status: "error" };
  const recentSpecimens: SectionResult<RecentSpecimenRow[]> = specimens
    ? { status: "ok", data: await buildRecentSpecimens(specimens, storageUnitsResult) }
    : { status: "error" };
  const storageHealth: SectionResult<StorageHealthItem[]> =
    occupancyResult.status === "fulfilled"
      ? { status: "ok", data: buildStorageHealth(occupancyResult.value) }
      : { status: "error" };
  const recentActivity: SectionResult<ActivityItem[]> =
    auditResult.status === "fulfilled"
      ? { status: "ok", data: buildRecentActivity(auditResult.value.items) }
      : { status: "error" };

  return {
    stats,
    collectionByType,
    catalogingTrend,
    catalogingQueue,
    recentSpecimens,
    storageHealth,
    recentActivity,
  };
}

function buildStats(
  specimens: SpecimenSummary[] | null,
  inquiriesResult: PromiseSettledResult<Inquiry[]>,
  visitRequestsResult: PromiseSettledResult<VisitRequest[]>,
): SectionResult<DashboardStat[]> {
  if (!specimens || inquiriesResult.status === "rejected" || visitRequestsResult.status === "rejected") {
    return { status: "error" };
  }

  const now = new Date();
  const createdThisMonth = specimens.filter((specimen) => isSameMonth(new Date(specimen.createdAt), now)).length;
  const draftCount = specimens.filter((specimen) => specimen.status === "UNCATALOGED").length;
  const pendingCount =
    inquiriesResult.value.filter((inquiry) => inquiry.status === "PENDING").length +
    visitRequestsResult.value.filter((visitRequest) => visitRequest.status === "PENDING").length;
  const duplicateCount = countPossibleDuplicates(specimens);

  const stats: DashboardStat[] = [
    {
      key: "total",
      label: "Total Specimens",
      value: specimens.length.toLocaleString(),
      note: createdThisMonth > 0 ? `+${createdThisMonth} this month` : "No new records this month",
      tone: "positive",
      icon: "specimen",
    },
    {
      key: "draft",
      label: "Draft / Incomplete",
      value: draftCount.toLocaleString(),
      note: "Awaiting cataloging",
      tone: draftCount > 0 ? "warning" : "positive",
      icon: "draft",
    },
    {
      key: "pending",
      label: "Pending Requests",
      value: pendingCount.toLocaleString(),
      note: "Inquiries & visit requests",
      tone: pendingCount > 0 ? "warning" : "positive",
      icon: "mail",
    },
    {
      key: "duplicates",
      label: "Possible Duplicates",
      value: duplicateCount.toLocaleString(),
      note: "Same scientific name & category",
      tone: duplicateCount > 0 ? "danger" : "positive",
      icon: "lock",
    },
  ];

  return { status: "ok", data: stats };
}

// Approximation, not the SRS's REQ-4.4-21/22 curator-facing duplicate warning
// (that lives in the catalog module). Flags active specimens sharing a
// scientific name and category as a signal worth a curator's attention.
function countPossibleDuplicates(specimens: SpecimenSummary[]): number {
  const groups = new Map<string, number>();

  for (const specimen of specimens) {
    const name = specimen.scientificName?.trim().toLowerCase();
    const category = specimen.specimenCategory?.trim().toLowerCase();
    if (!name || !category) continue;

    const key = `${name}|${category}`;
    groups.set(key, (groups.get(key) ?? 0) + 1);
  }

  let duplicates = 0;
  for (const count of groups.values()) {
    if (count > 1) duplicates += count;
  }
  return duplicates;
}

function buildCollectionByType(specimens: SpecimenSummary[]): CollectionByType {
  const counts = new Map<string, number>();

  for (const specimen of specimens) {
    const label = specimen.specimenCategory?.trim() || "Uncategorized";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const total = specimens.length;
  const segments = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({
      label,
      value,
      pct: total > 0 ? Math.round((value / total) * 1000) / 10 : 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));

  return { segments, total };
}

function buildCatalogingTrend(specimens: SpecimenSummary[]): CatalogingTrendPoint[] {
  const now = new Date();
  const months = Array.from({ length: TREND_MONTHS }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (TREND_MONTHS - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleString("en-US", { month: "short" }),
    };
  });

  const counts = new Map(months.map((month) => [month.key, 0]));
  for (const specimen of specimens) {
    const created = new Date(specimen.createdAt);
    const key = `${created.getFullYear()}-${created.getMonth()}`;
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return months.map((month) => ({ month: month.label, value: counts.get(month.key) ?? 0 }));
}

function buildCatalogingQueue(specimens: SpecimenSummary[]): QueueItem[] {
  return specimens
    .filter((specimen) => specimen.status === "UNCATALOGED")
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, CATALOGING_QUEUE_LIMIT)
    .map((specimen) => ({
      id: specimen.id,
      accessionNo: specimen.accessionNumber ?? "Unassigned",
      species: specimen.scientificName ?? specimen.commonName ?? "Unidentified specimen",
      category: specimen.specimenCategory,
    }));
}

async function buildRecentSpecimens(
  specimens: SpecimenSummary[],
  storageUnitsResult: PromiseSettledResult<StorageUnit[]>,
): Promise<RecentSpecimenRow[]> {
  const recent = [...specimens]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, RECENT_SPECIMENS_LIMIT);

  const labelByUnitId = new Map<string, string>();
  if (storageUnitsResult.status === "fulfilled") {
    for (const unit of storageUnitsResult.value) labelByUnitId.set(unit.id, unit.label);
  }

  const lotsBySpecimen = await Promise.all(
    recent.map((specimen) => listActiveLots(specimen.id).catch((): SpecimenLot[] => [])),
  );

  return recent.map((specimen, index) => {
    const [primaryLot] = lotsBySpecimen[index];

    return {
      id: specimen.id,
      accessionNo: specimen.accessionNumber ?? "Unassigned",
      commonName: specimen.commonName ?? specimen.scientificName ?? "Unnamed specimen",
      category: specimen.specimenCategory,
      storageLocation: primaryLot ? (labelByUnitId.get(primaryLot.storageUnitId) ?? "Unknown location") : null,
      condition: primaryLot?.conditionClass ?? null,
      catalogStatus: toCatalogStatusLabel(specimen.status),
      publicStatus: specimen.publicDisplay ? "Public" : "Restricted",
      lastUpdated: specimen.updatedAt,
    };
  });
}

function toCatalogStatusLabel(status: SpecimenSummary["status"]): SpecimenCatalogStatus {
  if (status === "CATALOGED") return "Cataloged";
  if (status === "ARCHIVED") return "Archived";
  return "Uncataloged";
}

function buildStorageHealth(items: StorageOccupancySummary[]): StorageHealthItem[] {
  return items
    .map((item) => ({
      id: item.id,
      location: item.label,
      capacityPct:
        item.capacity && item.capacity > 0
          ? Math.min(100, Math.round((item.occupiedQuantity / item.capacity) * 100))
          : null,
      alerts: item.alertCount,
    }))
    .sort((a, b) => (b.capacityPct ?? -1) - (a.capacityPct ?? -1))
    .slice(0, STORAGE_HEALTH_LIMIT);
}

function buildRecentActivity(items: AuditLogEntry[]): ActivityItem[] {
  return items.map((item) => ({
    id: item.id,
    action: humanize(item.action),
    detail: item.affectedRecordType
      ? `${humanize(item.affectedRecordType)}${item.affectedRecordId ? ` · ${item.affectedRecordId.slice(0, 8)}` : ""}`
      : "—",
    by: item.actor?.fullName ?? "System",
    timestamp: item.createdAt,
    module: item.module,
    failed: item.result !== "SUCCESS",
  }));
}

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
