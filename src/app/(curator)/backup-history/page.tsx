/** Curator-facing, read-only visibility into backend backup execution metadata. */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BackupHistoryWorkspace } from "@/components/backup/BackupHistoryWorkspace";
import { listBackupHistory } from "@/features/backup/api";
import {
  backupDateRangeError,
  backupHistoryHref,
  parseBackupHistoryQuery,
} from "@/features/backup/query";
import type { BackupHistoryPage } from "@/features/backup/types";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

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
          Review backup execution metadata without exposing private artifact paths or operational controls.
        </p>
      </header>
      <BackupHistoryWorkspace history={history} query={query} errorMessage={errorMessage} />
    </div>
  );
}
