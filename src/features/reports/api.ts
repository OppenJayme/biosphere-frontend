/** Server-only client for the curator-only reports API. */

import "server-only";
import { apiFetch, apiResponse } from "@/lib/api-client";
import { buildStorageHierarchy, type StorageTreeNode } from "@/features/storage-locations/hierarchy";
import { listStorageLocations } from "@/features/storage-locations/api";
import {
  reportDefinitionListSchema,
  reportHistoryPageSchema,
  reportSummarySchema,
  type ReportDefinition,
  type ReportHistoryPage,
  type ReportHistoryQuery,
  type ReportStorageOption,
  type ReportSummary,
} from "./types";

export async function listReportDefinitions(): Promise<ReportDefinition[]> {
  const response = await apiFetch<unknown>("/reports", { method: "GET", cache: "no-store" });
  const parsed = reportDefinitionListSchema.safeParse(response);
  if (!parsed.success) throw new Error("The backend returned an invalid report list.");
  return parsed.data;
}

export async function getReportSummary(): Promise<ReportSummary> {
  const response = await apiFetch<unknown>("/reports/summary", {
    method: "GET",
    cache: "no-store",
  });
  const parsed = reportSummarySchema.safeParse(response);
  if (!parsed.success) throw new Error("The backend returned an invalid report summary.");
  return parsed.data;
}

export async function listReportHistory(query: ReportHistoryQuery): Promise<ReportHistoryPage> {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.type) params.set("type", query.type);
  if (query.result) params.set("result", query.result);

  const response = await apiFetch<unknown>(`/reports/history?${params}`, {
    method: "GET",
    cache: "no-store",
  });
  const parsed = reportHistoryPageSchema.safeParse(response);
  if (!parsed.success) throw new Error("The backend returned an invalid report history.");
  return parsed.data;
}

/** Every storage unit as a root-to-unit path, in hierarchy order. */
export async function listReportStorageOptions(): Promise<ReportStorageOption[]> {
  const units = await listStorageLocations("ALL");
  const options: ReportStorageOption[] = [];
  const visit = (nodes: StorageTreeNode[], parents: string[]) => {
    for (const node of nodes) {
      const path = [...parents, node.label];
      options.push({ id: node.id, pathLabel: path.join(" › "), archived: node.archivedAt !== null });
      visit(node.children, path);
    }
  };
  visit(buildStorageHierarchy(units), []);
  return options;
}

/** Generates a report; the caller streams the file back to the browser. */
export function generateReport(body: Record<string, unknown>) {
  return apiResponse("/reports", {
    method: "POST",
    body: JSON.stringify(body),
    cache: "no-store",
  });
}
