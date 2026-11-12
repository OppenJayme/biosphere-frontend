/** Runtime contracts for the reviewed, two-phase specimen import flow. */

import { z } from "zod";
import { specimenSummarySchema } from "./types";

export const MAX_SPECIMEN_IMPORT_FILE_BYTES = 5 * 1024 * 1024;

// Preview values are the raw spreadsheet input, including invalid values the curator must
// see alongside row errors. Business-valid create/commit contracts stay strict.
const rawPreviewText = z.string().max(MAX_SPECIMEN_IMPORT_FILE_BYTES).nullable().optional();
const importSpecimenDataSchema = z.object({
  collectionId: rawPreviewText,
  collectionName: z.string().nullable().optional(),
  accessionNumber: z.string().nullable().optional(),
  specimenCategory: z.string().nullable().optional(),
  scientificName: z.string().nullable().optional(),
  commonName: z.string().nullable().optional(),
  gender: rawPreviewText,
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
  // Older backends omit it; a blank accession number is generated at import.
  accessionNumberWillBeGenerated: z.boolean().optional(),
  // Values that will be left blank; the row can still be imported.
  fieldWarnings: z.array(z.string()).default([]),
  // Rows that were archived in a backup workbook start unselected.
  archivedInSource: z.boolean().default(false),
});

/** Lots read from a backup workbook's Lots sheet. */
export const importLotSheetSchema = z.object({
  matched: z.number().int().nonnegative(),
  inactive: z.number().int().nonnegative(),
  unmatched: z.number().int().nonnegative(),
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
  rowsWithFieldWarnings: z.number().int().nonnegative().max(500).default(0),
  archivedRows: z.number().int().nonnegative().max(500).default(0),
  lotSheet: importLotSheetSchema.nullable().default(null),
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

export type ImportActionResult<T> = { ok: true; data: T } | { ok: false; message: string };

export function validateImportFileMetadata(file: { name: string; size: number }) {
  if (file.size === 0) return "Choose a non-empty Excel (.xlsx) file to preview.";
  if (!/\.xlsx$/i.test(file.name)) {
    return "Only Excel (.xlsx) files can be imported. In Excel, use File > Save As and choose Excel Workbook (.xlsx).";
  }
  if (file.size > MAX_SPECIMEN_IMPORT_FILE_BYTES) {
    return "The import file exceeds the 5 MB upload limit.";
  }
  return null;
}

/** Rows selected by default: valid rows that were not archived in a backup. */
export function validImportRowNumbers(preview: SpecimenImportPreview) {
  return preview.rows
    .filter((row) => row.valid && !row.archivedInSource)
    .map((row) => row.rowNumber);
}

export function selectedWarningCount(
  preview: SpecimenImportPreview,
  selected: ReadonlySet<number>,
) {
  return preview.rows.filter(
    (row) => selected.has(row.rowNumber) && row.duplicateWarnings.length > 0,
  ).length;
}
