import "server-only";
import { apiFetch } from "@/lib/api-client";
import { auditLogPageSchema, type AuditLogPage } from "./types";

export async function listAuditLogs(params: { page: number; limit: number }): Promise<AuditLogPage> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });

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
