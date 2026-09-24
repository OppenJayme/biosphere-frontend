/** Server-only client for reading protected, immutable audit history. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import { auditDateBounds } from "./query";
import {
  auditLogPageSchema,
  type AuditLogListQuery,
  type AuditLogPage,
} from "./types";

type ListAuditLogsParams = {
  page: number;
  limit: number;
} & Partial<Omit<AuditLogListQuery, "page" | "limit">>;

export async function listAuditLogs(params: ListAuditLogsParams): Promise<AuditLogPage> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  const { from, to } = auditDateBounds({
    fromDate: params.fromDate ?? "",
    toDate: params.toDate ?? "",
  });

  if (params.search) query.set("search", params.search);
  if (params.result) query.set("result", params.result);
  if (params.module) query.set("module", params.module);
  if (params.action) query.set("action", params.action);
  if (params.affectedRecordType) {
    query.set("affectedRecordType", params.affectedRecordType);
  }
  if (from) query.set("from", from);
  if (to) query.set("to", to);

  const response = await apiFetch<unknown>(`/audit-logs?${query}`, {
    method: "GET",
    cache: "no-store",
  });
  const result = auditLogPageSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid audit log response.");
  }

  return result.data;
}
