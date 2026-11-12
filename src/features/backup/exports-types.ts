/** Runtime contract for the weekly Excel export status (backend spec 0003). */

import { z } from "zod";

const countsSchema = z.record(z.string(), z.number().int().nonnegative());

export const exportEntrySchema = z.object({
  id: z.uuid(),
  type: z.enum(["WEEKLY", "MANUAL"]),
  exportDate: z.string().nullable(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "FAILED"]),
  startedAt: z.iso.datetime({ offset: true }),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  rowCounts: countsSchema.nullable(),
  truncatedCounts: countsSchema.nullable(),
  fileBytes: z.number().int().nonnegative().nullable(),
  fileSha256: z.string().nullable(),
  fieldSetVersion: z.string().nullable(),
  failureCode: z.string().nullable(),
  attempt: z.number().int().nullable(),
  downloadable: z.boolean(),
  expired: z.boolean(),
  startedBy: z.string().nullable(),
});

export const exportOverviewSchema = z.object({
  enabled: z.boolean(),
  schedule: z.string(),
  timeZone: z.string(),
  nextExportDate: z.string(),
  overdue: z.boolean(),
  lastCompletedAt: z.iso.datetime({ offset: true }).nullable(),
  lastFailure: z
    .object({ at: z.iso.datetime({ offset: true }), code: z.string().nullable() })
    .nullable(),
  retentionWeeks: z.number().int().positive().nullable(),
  fieldSet: z.object({
    version: z.string(),
    status: z.enum(["PROVISIONAL", "APPROVED"]),
    note: z.string(),
  }),
  items: z.array(exportEntrySchema),
});

export type ExportEntry = z.infer<typeof exportEntrySchema>;
export type ExportOverview = z.infer<typeof exportOverviewSchema>;

/** Plain-language meaning of each stored failure code. */
export const EXPORT_FAILURE_LABELS: Record<string, string> = {
  DB_READ_FAILED: "The database could not be read",
  COUNT_MISMATCH: "Row counts did not match the database",
  FIELD_MISMATCH: "Columns did not match the expected layout",
  RELATION_MISMATCH: "A record pointed to a missing related record",
  WRITE_FAILED: "The workbook could not be written",
  UPLOAD_FAILED: "The file could not be stored",
  READBACK_FAILED: "The saved file could not be read back",
  INTERRUPTED: "The export was interrupted (server restart)",
};
