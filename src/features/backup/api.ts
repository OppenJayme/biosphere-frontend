/** Server-only client for curator-protected backup history, policy, and manual runs. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import { backupDateBounds } from "./query";
import {
  backupHistoryEntrySchema,
  backupHistoryPageSchema,
  backupPolicySchema,
  type BackupHistoryEntry,
  type BackupHistoryListQuery,
  type BackupHistoryPage,
  type BackupPolicy,
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

export async function getBackupPolicy(): Promise<BackupPolicy> {
  const response = await apiFetch<unknown>("/backups/policy", {
    method: "GET",
    cache: "no-store",
  });
  const parsed = backupPolicySchema.safeParse(response);
  if (!parsed.success) {
    throw new Error("The backend returned an invalid backup-policy response.");
  }
  return parsed.data;
}

/** Runs a manual backup; resolves with the recorded history entry. */
export async function runBackupNow(): Promise<BackupHistoryEntry> {
  const response = await apiFetch<unknown>("/backups/run", { method: "POST" });
  const parsed = backupHistoryEntrySchema.safeParse(response);
  if (!parsed.success) {
    throw new Error("The backend returned an invalid backup result.");
  }
  return parsed.data;
}
