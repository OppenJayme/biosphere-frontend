/** Live, read-only audit workspace backed by NestJS pagination and filters. */

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { auditLogListHref } from "@/features/audit/query";
import type { AuditLogListQuery, AuditLogPage } from "@/features/audit/types";
import { AuditLogDetailPanel } from "./AuditLogDetailPanel";
import { AuditLogTable } from "./AuditLogTable";
import { AuditToolbar } from "./AuditToolbar";

function paginationPages(current: number, last: number) {
  return [...new Set([1, current - 1, current, current + 1, last])]
    .filter((page) => page >= 1 && page <= last)
    .sort((a, b) => a - b);
}

export function AuditLogsWorkspace({
  auditPage,
  recordLabels = {},
  query,
  errorMessage,
}: {
  auditPage: AuditLogPage | null;
  /** Record names keyed by `${recordType}:${recordId}`, from resolveAuditRecordLabels. */
  recordLabels?: Record<string, string>;
  query: AuditLogListQuery;
  errorMessage?: string;
}) {
  const logs = auditPage?.items ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(logs[0]?.id ?? null);
  const selected = logs.find((log) => log.id === selectedId) ?? null;
  const lastPage = auditPage ? Math.max(1, Math.ceil(auditPage.total / auditPage.limit)) : 1;
  const pages = useMemo(
    () => paginationPages(auditPage?.page ?? 1, lastPage),
    [auditPage?.page, lastPage],
  );

  return (
    <div className="space-y-4">
      <AuditToolbar query={query} />

      {errorMessage ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">Audit history could not be loaded.</p>
          <p className="mt-1 text-amber-900">{errorMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-4 rounded-xl border border-black/10 bg-white p-5">
            <AuditLogTable logs={logs} recordLabels={recordLabels} selectedId={selectedId} onSelect={setSelectedId} />

            {auditPage && auditPage.total > 0 && (
              <nav
                aria-label="Audit log pagination"
                className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-xs text-zinc-500"
              >
                <p>
                  Showing {(auditPage.page - 1) * auditPage.limit + 1}–
                  {Math.min(auditPage.page * auditPage.limit, auditPage.total)} of {auditPage.total.toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  {auditPage.page > 1 ? (
                    <Link
                      href={auditLogListHref(query, auditPage.page - 1)}
                      aria-label="Previous page"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-sage-100"
                    >
                      <ChevronLeftIcon className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center text-zinc-300">
                      <ChevronLeftIcon className="h-3.5 w-3.5" />
                    </span>
                  )}

                  {pages.map((page, index) => (
                    <span key={page} className="contents">
                      {index > 0 && pages[index - 1] !== page - 1 && (
                        <span className="px-1 text-zinc-400">…</span>
                      )}
                      <Link
                        href={auditLogListHref(query, page)}
                        aria-current={page === auditPage.page ? "page" : undefined}
                        className={`flex h-8 min-w-8 items-center justify-center rounded-md px-2 font-medium ${
                          page === auditPage.page
                            ? "border border-forest-700 text-forest-700"
                            : "text-zinc-600 hover:bg-sage-100"
                        }`}
                      >
                        {page}
                      </Link>
                    </span>
                  ))}

                  {auditPage.page < lastPage ? (
                    <Link
                      href={auditLogListHref(query, auditPage.page + 1)}
                      aria-label="Next page"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-sage-100"
                    >
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center text-zinc-300">
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </nav>
            )}
          </div>

          <AuditLogDetailPanel log={selected} recordLabels={recordLabels} onClear={() => setSelectedId(null)} />
        </div>
      )}
    </div>
  );
}
