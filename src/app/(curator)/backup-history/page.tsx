/** Curator backup history plus the backup policy and manual "Back up now" command. */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackupHistoryWorkspace } from "@/components/backup/BackupHistoryWorkspace";
import { BackupPolicyPanel } from "@/components/backup/BackupPolicyPanel";
import { getBackupPolicy, listBackupHistory } from "@/features/backup/api";
import {
  backupDateRangeError,
  backupHistoryHref,
  parseBackupHistoryQuery,
} from "@/features/backup/query";
import type { BackupHistoryPage, BackupPolicy } from "@/features/backup/types";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = { title: "Backup History" };

const notices: Record<string, { tone: "ok" | "error"; text: string }> = {
  "backup-completed": { tone: "ok", text: "Backup completed and stored privately." },
  "backup-failed": { tone: "error", text: "The backup ran but failed. The failure is recorded below; try again or check storage settings." },
  "backup-running": { tone: "error", text: "A backup is already running. Wait for it to finish, then try again." },
  "backup-forbidden": { tone: "error", text: "Your active account does not have permission to run backups." },
  "backup-unavailable": { tone: "error", text: "The backup could not be started. Check the backend connection and try again." },
};

export default async function BackupHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await verifySession())) redirect("/login?from=/backup-history");

  const params = await searchParams;
  const query = parseBackupHistoryQuery(params);
  const noticeKey = Array.isArray(params.notice) ? params.notice[0] : params.notice;
  const notice = noticeKey ? notices[noticeKey] : undefined;
  let policy: BackupPolicy | null = null;
  let policyError: string | undefined;
  try {
    policy = await getBackupPolicy();
  } catch {
    policyError = "The backup policy is temporarily unavailable.";
  }
  let history: BackupHistoryPage | null = null;
  let errorMessage = backupDateRangeError(query) ?? undefined;

  if (!errorMessage) {
    try {
      history = await listBackupHistory(query);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirect("/login?from=/backup-history");
      }
      errorMessage =
        error instanceof ApiError && error.status === 403
          ? "Your active account does not have permission to review backup history."
          : "Check the backend connection and try again. No sample backup records are shown.";
    }
  }

  if (history) {
    const lastPage = Math.max(1, Math.ceil(history.total / history.limit));
    if (query.page > lastPage) redirect(backupHistoryHref(query, lastPage));
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Backup History</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Run a backup on demand and review backup execution metadata without exposing private artifact paths.
        </p>
      </header>
      {notice && (
        <div
          role="status"
          className={`rounded-lg border px-4 py-3 text-sm font-medium ${notice.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}
        >
          {notice.text}
        </div>
      )}
      <BackupPolicyPanel policy={policy} errorMessage={policyError} />
      <BackupHistoryWorkspace history={history} query={query} errorMessage={errorMessage} />
    </div>
  );
}
