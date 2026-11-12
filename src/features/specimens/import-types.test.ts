import { describe, expect, it } from "vitest";
import {
  selectedWarningCount,
  specimenImportCommitSchema,
  specimenImportPreviewSchema,
  validateImportFileMetadata,
  validImportRowNumbers,
} from "./import-types";

const preview = {
  previewId: "11111111-1111-4111-8111-111111111111",
  expiresAt: "2026-09-26T10:00:00.000Z",
  rows: [
    {
      rowNumber: 1,
      data: { scientificName: "Testus validus" },
      errors: [],
      duplicateWarnings: [],
      valid: true,
    },
    {
      rowNumber: 2,
      data: { accessionNumber: "DUP-1" },
      errors: [],
      duplicateWarnings: ["Possible duplicate accession number"],
      valid: true,
    },
    {
      rowNumber: 3,
      data: {},
      errors: ["At least one specimen field is required"],
      duplicateWarnings: [],
      valid: false,
    },
  ],
  unmappedColumns: [],
  totalRows: 3,
  validRows: 2,
  invalidRows: 1,
  rowsWithWarnings: 1,
};

describe("specimen import contracts", () => {
  it("accepts a bounded preview and selects only valid rows", () => {
    const parsed = specimenImportPreviewSchema.parse(preview);
    expect(validImportRowNumbers(parsed)).toEqual([1, 2]);
    expect(selectedWarningCount(parsed, new Set([1, 2]))).toBe(1);
    expect(selectedWarningCount(parsed, new Set([1]))).toBe(0);
  });

  it("defaults the newer fields for an older backend", () => {
    const parsed = specimenImportPreviewSchema.parse(preview);
    expect(parsed.rows[0].fieldWarnings).toEqual([]);
    expect(parsed.rows[0].archivedInSource).toBe(false);
    expect(parsed).toMatchObject({
      rowsWithFieldWarnings: 0,
      archivedRows: 0,
      lotSheet: null,
      restoreNotice: null,
      lotsToImport: 0,
      lotsSkipped: 0,
    });
    expect(parsed.rows[0]).toMatchObject({ lotsToImport: 0, lotsSkipped: 0 });
    expect(
      specimenImportCommitSchema.parse({
        importBatchId: "22222222-2222-4222-8222-222222222222",
        results: [{ rowNumber: 1, success: true }],
        createdCount: 1,
        failedCount: 0,
      }),
    ).toMatchObject({ lotsCreated: 0, lotsSkipped: 0 });
  });

  it("keeps rows with blank values selectable and leaves archived backup rows unselected", () => {
    const parsed = specimenImportPreviewSchema.parse({
      ...preview,
      rows: [
        { ...preview.rows[0], fieldWarnings: ['Collection "Old" was not found; it will be left blank.'] },
        { ...preview.rows[1], archivedInSource: true },
        preview.rows[2],
      ],
      rowsWithFieldWarnings: 1,
      archivedRows: 1,
      lotSheet: { matched: 2, inactive: 1, unmatched: 0 },
    });
    expect(validImportRowNumbers(parsed)).toEqual([1]);
    expect(parsed.rows[0].fieldWarnings).toHaveLength(1);
    expect(parsed.lotSheet).toEqual({ matched: 2, inactive: 1, unmatched: 0 });

    const backup = specimenImportPreviewSchema.parse({
      ...preview,
      rows: [{ ...preview.rows[0], lotsToImport: 1, lotsSkipped: 1 }],
      restoreNotice: "This re-imports specimens and their lots. It is not a full restore.",
      lotsToImport: 1,
      lotsSkipped: 1,
    });
    expect(backup.restoreNotice).toContain("not a full restore");
    expect(backup.rows[0]).toMatchObject({ lotsToImport: 1, lotsSkipped: 1 });
  });

  it("rejects malformed commit responses", () => {
    expect(
      specimenImportCommitSchema.safeParse({
        importBatchId: "not-a-uuid",
        results: [],
        createdCount: -1,
        failedCount: 0,
      }).success,
    ).toBe(false);
  });

  it("preserves invalid raw values without losing valid rows or their errors", () => {
    const mixedPreview = {
      ...preview,
      rows: [
        preview.rows[0],
        {
          rowNumber: 2,
          data: { collectionId: "not-a-uuid", gender: "BAD_VALUE" },
          valid: false,
          errors: ["collectionId must be a UUID", "gender must be a valid enum value"],
          duplicateWarnings: [],
        },
      ],
      totalRows: 2,
      validRows: 1,
      invalidRows: 1,
      rowsWithWarnings: 0,
    };
    const parsed = specimenImportPreviewSchema.parse(mixedPreview);
    expect(parsed.rows[1].data).toEqual({
      collectionId: "not-a-uuid",
      gender: "BAD_VALUE",
    });
    expect(parsed.rows[1].errors).toEqual(mixedPreview.rows[1].errors);
    expect(validImportRowNumbers(parsed)).toEqual([1]);
  });

  it("still rejects malformed row shapes and oversized previews", () => {
    expect(
      specimenImportPreviewSchema.safeParse({
        ...preview,
        rows: [{ ...preview.rows[0], data: { gender: { unexpected: true } } }],
      }).success,
    ).toBe(false);
    expect(
      specimenImportPreviewSchema.safeParse({
        ...preview,
        rows: Array.from({ length: 501 }, () => preview.rows[0]),
      }).success,
    ).toBe(false);
  });

  it("accepts only .xlsx and rejects CSV, empty, legacy Excel and oversized uploads before sending", () => {
    expect(validateImportFileMetadata({ name: "specimens.xlsx", size: 10 })).toBeNull();
    expect(validateImportFileMetadata({ name: "specimens.XLSX", size: 10 })).toBeNull();
    expect(validateImportFileMetadata({ name: "specimens.xlsx", size: 0 })).toMatch(/non-empty/i);
    expect(validateImportFileMetadata({ name: "specimens.csv", size: 10 })).toMatch(/Only Excel \(\.xlsx\)/);
    expect(validateImportFileMetadata({ name: "specimens.xls", size: 10 })).toMatch(/\.xlsx/i);
    expect(
      validateImportFileMetadata({
        name: "specimens.xlsx",
        size: 5 * 1024 * 1024 + 1,
      }),
    ).toMatch(/5 MB/i);
  });
});
