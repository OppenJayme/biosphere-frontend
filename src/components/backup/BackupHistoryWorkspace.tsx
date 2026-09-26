/** Read-only backup metadata table with server-backed filters and pagination. */

import Link from "next/link";
import {
  ArchiveIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from "@/components/icons";
import { backupHistoryHref } from "@/features/backup/query";
import {
  BACKUP_PAGE_SIZES,
  BACKUP_STATUSES,
  type BackupHistoryListQuery,
  type BackupHistoryPage,
  type BackupStatus,
} from "@/features/backup/types";

const inputClasses =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";

const STATUS_STYLES: Record<BackupStatus, string> = {
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-forest-100 text-forest-700",
  FAILED: "bg-red-100 text-red-700",
};

function formatTimestamp(value: string | null) {
  if (!value) return "Not completed";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function paginationPages(current: number, last: number) {
  return [...new Set([1, current - 1, current, current + 1, last])]
    .filter((page) => page >= 1 && page <= last)
    .sort((a, b) => a - b);
}

export function BackupHistoryWorkspace({
  history,
  query,
  errorMessage,
}: {
  history: BackupHistoryPage | null;
  query: BackupHistoryListQuery;
  errorMessage?: string;
}) {
  const lastPage = history ? Math.max(1, Math.ceil(history.total / history.limit)) : 1;
  const pages = paginationPages(history?.page ?? 1, lastPage);

  return (
    <div className="space-y-4">
      <form
        action="/backup-history"
        method="get"
        className="space-y-3 rounded-xl border border-black/10 bg-white p-4"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="xl:col-span-2">
            <span className="mb-1 block text-xs font-medium text-zinc-600">
              Search backup history
            </span>
            <span className="relative block">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                name="search"
                type="search"
                defaultValue={query.search}
                maxLength={100}
                placeholder="Backup type, creator, or exact UUID"
                className={`${inputClasses} pl-9`}
              />
            </span>
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-zinc-600">Status</span>
            <select name="status" defaultValue={query.status} className={inputClasses}>
              <option value="">All statuses</option>
              {BACKUP_STATUSES.map((status) => (
                <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-zinc-600">Rows per page</span>
            <select name="limit" defaultValue={query.limit} className={inputClasses}>
              {BACKUP_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>{size} rows</option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-xs font-medium text-zinc-600">Backup type</span>
            <input
              name="backupType"
              defaultValue={query.backupType}
              maxLength={100}
              placeholder="Example: SCHEDULED_FULL"
              className={inputClasses}
            />
          </label>

          <div className="grid grid-cols-2 gap-2 xl:col-span-2">
            <label>
              <span className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-600">
                <CalendarIcon className="h-3.5 w-3.5" /> From
              </span>
              <input name="fromDate" type="date" defaultValue={query.fromDate} className={inputClasses} />
            </label>
            <label>
              <span className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-600">
                <CalendarIcon className="h-3.5 w-3.5" /> To
              </span>
              <input name="toDate" type="date" defaultValue={query.toDate} className={inputClasses} />
            </label>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/backup-history" className="rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100">
            Clear filters
          </Link>
          <button type="submit" className="rounded-lg bg-forest-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-800">
            Apply filters
          </button>
        </div>
      </form>

      {errorMessage ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">Backup history could not be loaded.</p>
          <p className="mt-1 text-amber-900">{errorMessage}</p>
        </div>
      ) : (
        <section className="rounded-xl border border-black/10 bg-white p-5">
          {history && history.items.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/10 text-xs text-zinc-500">
                      <th className="py-2 pr-3 font-medium">Started</th>
                      <th className="py-2 pr-3 font-medium">Backup type</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 pr-3 font-medium">Created by</th>
                      <th className="py-2 pr-3 font-medium">Completed</th>
                      <th className="py-2 font-medium">Artifact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {history.items.map((entry) => (
                      <tr key={entry.id} className="hover:bg-sage-50">
                        <td className="whitespace-nowrap py-3 pr-3 text-zinc-600">{formatTimestamp(entry.startedAt)}</td>
                        <td className="py-3 pr-3 font-medium text-zinc-800">{entry.backupType}</td>
                        <td className="py-3 pr-3">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[entry.status]}`}>
                            {entry.status.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-zinc-700">
                          {entry.creator ? `${entry.creator.fullName} · ${entry.creator.role}` : "Automated process"}
                        </td>
                        <td className="whitespace-nowrap py-3 pr-3 text-zinc-600">{formatTimestamp(entry.completedAt)}</td>
                        <td className="py-3 text-zinc-600">{entry.artifactAvailable ? "Recorded" : "Not recorded"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <nav aria-label="Backup history pagination" className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-xs text-zinc-500">
                <p>
                  Showing {(history.page - 1) * history.limit + 1}–{Math.min(history.page * history.limit, history.total)} of {history.total.toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  {history.page > 1 ? (
                    <Link href={backupHistoryHref(query, history.page - 1)} aria-label="Previous page" className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-sage-100">
                      <ChevronLeftIcon className="h-3.5 w-3.5" />
                    </Link>
                  ) : <span className="flex h-8 w-8 items-center justify-center text-zinc-300"><ChevronLeftIcon className="h-3.5 w-3.5" /></span>}
                  {pages.map((page, index) => (
                    <span key={page} className="contents">
                      {index > 0 && pages[index - 1] !== page - 1 && <span className="px-1 text-zinc-400">…</span>}
                      <Link href={backupHistoryHref(query, page)} aria-current={page === history.page ? "page" : undefined} className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 font-medium ${page === history.page ? "border border-forest-700 text-forest-700" : "text-zinc-600 hover:bg-sage-100"}`}>
                        {page}
                      </Link>
                    </span>
                  ))}
                  {history.page < lastPage ? (
                    <Link href={backupHistoryHref(query, history.page + 1)} aria-label="Next page" className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-sage-100">
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </Link>
                  ) : <span className="flex h-8 w-8 items-center justify-center text-zinc-300"><ChevronRightIcon className="h-3.5 w-3.5" /></span>}
                </div>
              </nav>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-black/15 px-4 py-12 text-center">
              <ArchiveIcon className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-3 text-sm font-medium text-zinc-800">No backup entries match these filters.</p>
              <p className="mt-1 text-xs text-zinc-500">Backup execution records will appear here when available.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
