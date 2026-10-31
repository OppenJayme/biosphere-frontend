/** Protected, read-only audit history sourced from the BioSphere backend. */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuditLogsWorkspace } from "@/components/audit/AuditLogsWorkspace";
import { listAuditLogs } from "@/features/audit/api";
import {
  auditLogDateRangeError,
  auditLogListHref,
  parseAuditLogListQuery,
} from "@/features/audit/query";
import type { AuditLogPage } from "@/features/audit/types";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { PageHeader } from "@/components/curator/PageHeader";
import { resolveAuditRecordLabels, type RecordLabels } from "@/features/audit/record-labels";

export const metadata: Metadata = {
  title: "Audit Log",
};

type AuditLogsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  if (!(await verifySession())) redirect("/login?from=/audit-logs");

  const query = parseAuditLogListQuery(await searchParams);
  let auditPage: AuditLogPage | null = null;
  let recordLabels: RecordLabels = {};
  let errorMessage = auditLogDateRangeError(query) ?? undefined;

  if (!errorMessage) {
    try {
      auditPage = await listAuditLogs(query);
      recordLabels = await resolveAuditRecordLabels(auditPage.items);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirect("/login?from=/audit-logs");
      }
      errorMessage =
        error instanceof ApiError && error.status === 403
          ? "Your active account does not have permission to review audit history."
          : "Check the backend connection and try again. No sample audit events are shown.";
    }
  }

  if (auditPage) {
    const lastPage = Math.max(1, Math.ceil(auditPage.total / auditPage.limit));
    if (query.page > lastPage) redirect(auditLogListHref(query, lastPage));
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit Log"
        description="Everything that was done in BioSphere, who did it, and when."
        info="This is a permanent record. Entries can't be edited or deleted, so it can be trusted when you need to check what happened."
      />

      <AuditLogsWorkspace
        key={auditLogListHref(query)}
        auditPage={auditPage}
        recordLabels={recordLabels}
        query={query}
        errorMessage={errorMessage}
      />
    </div>
  );
}
