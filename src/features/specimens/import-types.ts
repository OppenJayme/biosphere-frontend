/** Runtime contracts for the reviewed, two-phase specimen CSV import flow. */

import { z } from "zod";
import { specimenSummarySchema } from "./types";

export const MAX_SPECIMEN_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

const importSpecimenDataSchema = z.object({
  collectionId: z.uuid().nullable().optional(),
  accessionNumber: z.string().nullable().optional(),
  specimenCategory: z.string().nullable().optional(),
  scientificName: z.string().nullable().optional(),
  commonName: z.string().nullable().optional(),
  gender: z.enum(["MALE", "FEMALE", "UNKNOWN", "NOT_APPLICABLE"]).nullable().optional(),
  classificationStatus: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  rowNumber: z.number().int().positive().optional(),
});

export const specimenImportPreviewRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  data: importSpecimenDataSchema,
  errors: z.array(z.string()),
  duplicateWarnings: z.array(z.string()),
  valid: z.boolean(),
});

export const specimenImportPreviewSchema = z.object({
  previewId: z.uuid(),
  expiresAt: z.iso.datetime({ offset: true }),
  rows: z.array(specimenImportPreviewRowSchema).max(500),
  unmappedColumns: z.array(z.string()),
  totalRows: z.number().int().nonnegative().max(500),
  validRows: z.number().int().nonnegative().max(500),
  invalidRows: z.number().int().nonnegative().max(500),
  rowsWithWarnings: z.number().int().nonnegative().max(500),
});

export const specimenImportCommitRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  success: z.boolean(),
  specimen: specimenSummarySchema.optional(),
  errors: z.array(z.string()).optional(),
});

export const specimenImportCommitSchema = z.object({
  importBatchId: z.uuid(),
  results: z.array(specimenImportCommitRowSchema).max(500),
  createdCount: z.number().int().nonnegative().max(500),
  failedCount: z.number().int().nonnegative().max(500),
});

export type SpecimenImportPreviewRow = z.infer<typeof specimenImportPreviewRowSchema>;
export type SpecimenImportPreview = z.infer<typeof specimenImportPreviewSchema>;
export type SpecimenImportCommit = z.infer<typeof specimenImportCommitSchema>;

export type ImportActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export function validateImportFileMetadata(file: { name: string; size: number }) {
  if (file.size === 0) return "Choose a non-empty CSV file to preview.";
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return "Only .csv specimen import files are supported.";
  }
  if (file.size > MAX_SPECIMEN_IMPORT_FILE_BYTES) {
    return "The CSV exceeds the 5 MB upload limit.";
  }
  return null;
}

export function validImportRowNumbers(preview: SpecimenImportPreview) {
  return preview.rows.filter((row) => row.valid).map((row) => row.rowNumber);
}

export function selectedWarningCount(
  preview: SpecimenImportPreview,
  selected: ReadonlySet<number>,
) {
  return preview.rows.filter(
    (row) => selected.has(row.rowNumber) && row.duplicateWarnings.length > 0,
  ).length;
}
