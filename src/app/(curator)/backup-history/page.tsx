/** Curator-facing, read-only visibility into backend backup execution metadata. */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackupHistoryWorkspace } from "@/components/backup/BackupHistoryWorkspace";
import { listBackupHistory } from "@/features/backup/api";
import { getExportOverview } from "@/features/backup/exports-api";
import type { ExportOverview } from "@/features/backup/exports-types";
import { WeeklyExportsPanel } from "@/components/backup/WeeklyExportsPanel";
import {
  backupDateRangeError,
  backupHistoryHref,
  parseBackupHistoryQuery,
} from "@/features/backup/query";
import type { BackupHistoryPage } from "@/features/backup/types";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { PageHeader } from "@/components/curator/PageHeader";

export const metadata: Metadata = { title: "Backup History" };

export default async function BackupHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await verifySession())) redirect("/login?from=/backup-history");

  const query = parseBackupHistoryQuery(await searchParams);
  let history: BackupHistoryPage | null = null;
  let errorMessage = backupDateRangeError(query) ?? undefined;

  // Loaded alongside the history; an export failure never hides the history.
  const exportRequest: Promise<{ overview: ExportOverview | null; error?: string }> = getExportOverview().then(
    (overview) => ({ overview }),
    (error: unknown) => ({
      overview: null,
      error:
        error instanceof ApiError && error.status === 403
          ? "Your active account does not have permission to view exports."
          : "The export status could not be loaded. Check the backend connection and try again.",
    }),
  );

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

  const exports = await exportRequest;

  if (history) {
    const lastPage = Math.max(1, Math.ceil(history.total / history.limit));
    if (query.page > lastPage) redirect(backupHistoryHref(query, lastPage));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Backup History"
        description="Weekly Excel exports, and when backups ran and whether they succeeded. Backup file locations stay private."
      />
      <WeeklyExportsPanel overview={exports.overview} errorMessage={exports.error} />
      <BackupHistoryWorkspace history={history} query={query} errorMessage={errorMessage} />
    </div>
  );
}
