/** Live, read-only audit workspace backed by NestJS pagination and filters. */

"use client";

import { useState } from "react";
import { TablePagination } from "@/components/ui/TablePagination";
import { auditLogListHref } from "@/features/audit/query";
import type { AuditLogListQuery, AuditLogPage, AuditPageSize } from "@/features/audit/types";
import { AuditLogDetailPanel } from "./AuditLogDetailPanel";
import { AuditLogTable } from "./AuditLogTable";
import { AuditToolbar } from "./AuditToolbar";

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
              <TablePagination
                label="Audit log pages"
                noun="entries"
                page={auditPage.page}
                pageSize={query.limit}
                total={auditPage.total}
                hrefFor={(target) => auditLogListHref(query, target)}
                sizeHrefFor={(size) => auditLogListHref({ ...query, limit: size as AuditPageSize }, 1)}
              />
            )}
          </div>

          <AuditLogDetailPanel log={selected} recordLabels={recordLabels} onClear={() => setSelectedId(null)} />
        </div>
      )}
    </div>
  );
}
