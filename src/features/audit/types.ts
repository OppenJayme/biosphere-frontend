/** Runtime contracts for the protected audit-log API. */

import { z } from "zod";

export const auditActorSchema = z.object({
  id: z.uuid(),
  fullName: z.string().min(1),
  role: z.enum(["CURATOR", "DEVELOPER"]),
});

export const auditLogEntrySchema = z.object({
  id: z.uuid(),
  actor: auditActorSchema.nullable(),
  affectedRecordId: z.uuid().nullable(),
  affectedRecordType: z.string().nullable(),
  action: z.string().min(1),
  module: z.string().min(1),
  details: z.unknown(),
  result: z.enum(["SUCCESS", "FAILED", "DENIED"]),
  createdAt: z.string().min(1),
});

export const auditLogPageSchema = z.object({
  items: z.array(auditLogEntrySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>;
export type AuditLogPage = z.infer<typeof auditLogPageSchema>;

export const AUDIT_RESULTS = ["SUCCESS", "FAILED", "DENIED"] as const;
export const AUDIT_PAGE_SIZES = [10, 25, 50, 100] as const;

export type AuditResult = (typeof AUDIT_RESULTS)[number];
export type AuditPageSize = (typeof AUDIT_PAGE_SIZES)[number];

export type AuditLogListQuery = {
  search: string;
  result: AuditResult | "";
  module: string;
  action: string;
  affectedRecordType: string;
  fromDate: string;
  toDate: string;
  page: number;
  limit: AuditPageSize;
};
