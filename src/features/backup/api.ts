/** Server-only client for the curator-protected, read-only backup-history API. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import { backupDateBounds } from "./query";
import {
  backupHistoryPageSchema,
  type BackupHistoryListQuery,
  type BackupHistoryPage,
} from "./types";

export async function listBackupHistory(
  params: BackupHistoryListQuery,
): Promise<BackupHistoryPage> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  const { from, to } = backupDateBounds(params);

  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);
  if (params.backupType) query.set("backupType", params.backupType);
  if (from) query.set("from", from);
  if (to) query.set("to", to);

  const response = await apiFetch<unknown>(`/backups/history?${query}`, {
    method: "GET",
    cache: "no-store",
  });
  const parsed = backupHistoryPageSchema.safeParse(response);
  if (!parsed.success) {
    throw new Error("The backend returned an invalid backup-history response.");
  }

  return parsed.data;
}
