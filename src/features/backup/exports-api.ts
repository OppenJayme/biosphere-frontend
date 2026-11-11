/** Server-only client for the weekly Excel export API (backend spec 0003). */

import "server-only";
import { apiFetch, apiResponse } from "@/lib/api-client";
import { exportEntrySchema, exportOverviewSchema, type ExportEntry, type ExportOverview } from "./exports-types";

export async function getExportOverview(): Promise<ExportOverview> {
  const response = await apiFetch<unknown>("/backups/exports", { method: "GET", cache: "no-store" });
  const parsed = exportOverviewSchema.safeParse(response);
  if (!parsed.success) throw new Error("The backend returned an invalid export status response.");
  return parsed.data;
}

export async function runExportNow(): Promise<ExportEntry> {
  const response = await apiFetch<unknown>("/backups/exports/run", { method: "POST", cache: "no-store" });
  const parsed = exportEntrySchema.safeParse(response);
  if (!parsed.success) throw new Error("The backend returned an invalid export response.");
  return parsed.data;
}

/** The raw file response, streamed through to the browser. */
export function exportFileResponse(id: string): Promise<Response> {
  return apiResponse(`/backups/exports/${encodeURIComponent(id)}/file`, {
    method: "GET",
    cache: "no-store",
  });
}
