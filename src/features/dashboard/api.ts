import "server-only";
import { apiFetch, ApiError } from "@/lib/api-client";
import { listAuditLogs } from "../audit/api";
import type { AuditLogEntry } from "../audit/types";
import { listStorageLocations } from "../storage-locations/api";
import type { StorageUnit } from "../storage-locations/types";
import {
  buildCatalogingTrend,
  buildCollectionByType,
  buildStats,
  toQueueItem,
  toRecentRow,
} from "./summary";
import {
  dashboardSummarySchema,
  type ActivityItem,
  type DashboardData,
  type DashboardSummary,
  type SectionResult,
  type StorageOverviewItem,
} from "./types";


const RECENT_ACTIVITY_LIMIT = 6;
const STORAGE_HEALTH_LIMIT = 6;

/** Counts and short lists computed by the backend, so no full lists are downloaded. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiFetch<unknown>("/dashboard/summary", { method: "GET", cache: "no-store" });
  const parsed = dashboardSummarySchema.safeParse(response);
  if (!parsed.success) throw new Error("The backend returned an invalid dashboard summary.");
  return parsed.data;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [summaryResult, auditResult, storageUnitsResult] = await Promise.allSettled([
    getDashboardSummary(),
    listAuditLogs({ page: 1, limit: RECENT_ACTIVITY_LIMIT }),
    listStorageLocations(),
  ]);

  // An expired/invalid session fails every endpoint the same way — surface
  // that as a redirect-worthy error instead of separate "unavailable"
  // panels. Any other failure (a single endpoint down) degrades per-section.
  const unauthorized = [summaryResult, auditResult, storageUnitsResult].find(
    (result) => result.status === "rejected" && result.reason instanceof ApiError && result.reason.status === 401,
  );
  if (unauthorized && unauthorized.status === "rejected") {
    throw unauthorized.reason;
  }

  const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
  const fromSummary = <T>(build: (data: DashboardSummary) => T): SectionResult<T> =>
    summary ? { status: "ok", data: build(summary) } : { status: "error" };

  return {
    stats: fromSummary(buildStats),
    collectionByType: fromSummary(buildCollectionByType),
    catalogingTrend: fromSummary(buildCatalogingTrend),
    catalogingQueue: fromSummary((data) => data.catalogingQueue.map(toQueueItem)),
    recentSpecimens: fromSummary((data) => data.recentSpecimens.map(toRecentRow)),
    storageOverview:
      storageUnitsResult.status === "fulfilled"
        ? { status: "ok", data: buildStorageOverview(storageUnitsResult.value) }
        : { status: "error" },
    recentActivity:
      auditResult.status === "fulfilled"
        ? { status: "ok", data: buildRecentActivity(auditResult.value.items) }
        : { status: "error" },
    qrReadiness: fromSummary((data) => data.exhibits),
  };
}

function buildStorageOverview(items: StorageUnit[]): StorageOverviewItem[] {
  return items
    .filter((item) => item.holdsSpecimens)
    .map((item) => ({
      id: item.id,
      location: item.label,
      unitType: item.unitType,
      storageType: item.storageType,
      capacity: item.capacity,
    }))
    .sort((a, b) => a.location.localeCompare(b.location, undefined, { sensitivity: "base" }))
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
