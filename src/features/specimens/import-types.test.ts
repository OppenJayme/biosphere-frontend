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

  it("rejects empty, non-CSV, and oversized uploads before sending them", () => {
    expect(validateImportFileMetadata({ name: "specimens.csv", size: 10 })).toBeNull();
    expect(validateImportFileMetadata({ name: "specimens.csv", size: 0 })).toMatch(/non-empty/i);
    expect(validateImportFileMetadata({ name: "specimens.xlsx", size: 10 })).toMatch(/\.csv/i);
    expect(
      validateImportFileMetadata({
        name: "specimens.csv",
        size: 5 * 1024 * 1024 + 1,
      }),
    ).toMatch(/5 MB/i);
  });
});
