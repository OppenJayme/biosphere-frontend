import { describe, expect, it } from "vitest";
import { EXPORT_FAILURE_LABELS, exportOverviewSchema } from "./exports-types";

const entry = {
  id: "98ff93b6-9dc4-404d-9747-27044b201de1",
  type: "MANUAL",
  exportDate: "2026-11-12",
  status: "COMPLETED",
  startedAt: "2026-11-11T16:12:35.420Z",
  completedAt: "2026-11-11T16:12:38.521Z",
  rowCounts: { Specimens: 23, Lots: 24 },
  truncatedCounts: { Specimens: 0, Lots: 0 },
  fileBytes: 23592,
  fileSha256: "0c87879f9639",
  fieldSetVersion: "provisional-2026-11-12",
  failureCode: null,
  attempt: 1,
  downloadable: true,
  expired: false,
  startedBy: "Test Curator",
};

const overview = {
  enabled: true,
  schedule: "SAT 18:00",
  timeZone: "Asia/Manila",
  nextExportDate: "2026-11-14",
  overdue: false,
  lastCompletedAt: "2026-11-11T16:12:35.420Z",
  lastFailure: null,
  retentionWeeks: null,
  fieldSet: { version: "provisional-2026-11-12", status: "PROVISIONAL", note: "n" },
  items: [entry],
};

describe("export overview contract", () => {
  it("accepts the backend overview", () => {
    expect(exportOverviewSchema.safeParse(overview).success).toBe(true);
  });

  it("rejects an unknown status or negative counts", () => {
    expect(
      exportOverviewSchema.safeParse({ ...overview, items: [{ ...entry, status: "DONE" }] }).success,
    ).toBe(false);
    expect(
      exportOverviewSchema.safeParse({ ...overview, items: [{ ...entry, rowCounts: { Lots: -1 } }] }).success,
    ).toBe(false);
  });

  it("labels every backend failure code", () => {
    for (const code of [
      "DB_READ_FAILED",
      "COUNT_MISMATCH",
      "FIELD_MISMATCH",
      "RELATION_MISMATCH",
      "WRITE_FAILED",
      "UPLOAD_FAILED",
      "READBACK_FAILED",
      "INTERRUPTED",
    ]) {
      expect(EXPORT_FAILURE_LABELS[code]).toBeTruthy();
    }
  });
});
