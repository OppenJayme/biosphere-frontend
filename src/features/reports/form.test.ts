import { describe, expect, it } from "vitest";
import {
  attachmentFileName,
  buildReportRequest,
  initialReportFormState,
  museumToday,
  type ReportFormState,
} from "./form";
import type { ReportDefinition } from "./types";

const inventory: ReportDefinition = {
  type: "INVENTORY",
  title: "Inventory Report",
  description: "",
  formats: ["PDF", "CSV", "DOCX"],
  periods: ["MONTHLY", "YEARLY", "CUSTOM", "ALL_TIME"],
  filters: [
    "specimenStatus",
    "category",
    "family",
    "conditionClass",
    "storageUnitId",
    "includeDescendantUnits",
    "publicDisplay",
  ],
  periodAppliesTo: "Date the specimen was added.",
};

const consolidated: ReportDefinition = {
  type: "CONSOLIDATED_OPERATIONS",
  title: "Consolidated Museum Operations Report",
  description: "",
  formats: ["DOCX", "PDF"],
  periods: ["MONTHLY", "YEARLY", "CUSTOM"],
  filters: ["remarks"],
  periodAppliesTo: "",
};

// 2026-09-30T17:00Z is already October 1 in Manila.
const NOW = new Date("2026-09-30T17:00:00.000Z");

function state(overrides: Partial<ReportFormState> = {}): ReportFormState {
  return { ...initialReportFormState(inventory, NOW), ...overrides };
}

describe("report form", () => {
  it("defaults to the current museum month", () => {
    expect(museumToday(NOW)).toEqual({ month: "2026-10", year: "2026", date: "2026-10-01" });
    expect(state()).toMatchObject({ period: "MONTHLY", month: "2026-10", from: "2026-10-01" });
  });

  it("builds a monthly request with only the filters the report accepts", () => {
    const result = buildReportRequest(
      inventory,
      "CSV",
      state({
        family: "  Papilionidae ",
        specimenStatus: "CATALOGED",
        publicDisplay: "false",
        inquiryType: "Research",
        storageUnitId: "d0000000-0000-4000-8000-000000000001",
      }),
    );

    expect(result).toEqual({
      ok: true,
      body: {
        type: "INVENTORY",
        format: "CSV",
        period: "MONTHLY",
        month: "2026-10",
        family: "Papilionidae",
        specimenStatus: "CATALOGED",
        publicDisplay: false,
        storageUnitId: "d0000000-0000-4000-8000-000000000001",
      },
    });
  });

  it("sends the sub-location opt-out only with a location", () => {
    const withUnit = buildReportRequest(
      inventory,
      "PDF",
      state({
        period: "ALL_TIME",
        storageUnitId: "d0000000-0000-4000-8000-000000000001",
        includeDescendantUnits: false,
      }),
    );
    expect(withUnit).toMatchObject({ ok: true, body: { includeDescendantUnits: false } });

    const withoutUnit = buildReportRequest(
      inventory,
      "PDF",
      state({ period: "ALL_TIME", includeDescendantUnits: false }),
    );
    expect(withoutUnit).toEqual({
      ok: true,
      body: { type: "INVENTORY", format: "PDF", period: "ALL_TIME" },
    });
  });

  it("validates yearly and custom periods like the backend", () => {
    expect(buildReportRequest(inventory, "PDF", state({ period: "YEARLY", year: "2026" }))).toMatchObject({
      ok: true,
      body: { period: "YEARLY", year: 2026 },
    });
    expect(buildReportRequest(inventory, "PDF", state({ period: "YEARLY", year: "26" }))).toEqual({
      ok: false,
      error: "Enter a four-digit year, for example 2026.",
    });
    expect(
      buildReportRequest(inventory, "PDF", state({ period: "CUSTOM", from: "2026-09-30", to: "2026-09-01" })),
    ).toEqual({ ok: false, error: "The start date must not be after the end date." });
    expect(
      buildReportRequest(inventory, "PDF", state({ period: "CUSTOM", from: "2026-02-30", to: "2026-03-01" })),
    ).toEqual({ ok: false, error: "Choose both a start and an end date." });
    expect(
      buildReportRequest(inventory, "PDF", state({ period: "CUSTOM", from: "2010-01-01", to: "2026-01-01" })),
    ).toEqual({ ok: false, error: "A custom report period can cover at most 10 years." });
  });

  it("rejects formats and periods the report does not offer", () => {
    expect(buildReportRequest(consolidated, "CSV", state())).toEqual({
      ok: false,
      error: "The Consolidated Museum Operations Report is not available as CSV.",
    });
    expect(buildReportRequest(consolidated, "PDF", state({ period: "ALL_TIME" }))).toEqual({
      ok: false,
      error: "Choose a reporting period this report supports.",
    });
  });

  it("includes trimmed remarks for the Consolidated report", () => {
    expect(
      buildReportRequest(consolidated, "DOCX", state({ remarks: "  Busy month.  ", family: "x" })),
    ).toEqual({
      ok: true,
      body: {
        type: "CONSOLIDATED_OPERATIONS",
        format: "DOCX",
        period: "MONTHLY",
        month: "2026-10",
        remarks: "Busy month.",
      },
    });
    expect(
      buildReportRequest(consolidated, "DOCX", state({ remarks: "a".repeat(5001) })),
    ).toEqual({ ok: false, error: "Remarks must be at most 5,000 characters." });
  });

  it("rejects over-long text filters and malformed locations", () => {
    expect(buildReportRequest(inventory, "PDF", state({ category: "x".repeat(101) }))).toEqual({
      ok: false,
      error: "Category must be at most 100 characters.",
    });
    expect(buildReportRequest(inventory, "PDF", state({ storageUnitId: "room-101" }))).toEqual({
      ok: false,
      error: "Choose a storage location from the list.",
    });
  });

  it("reads the download file name from Content-Disposition", () => {
    expect(
      attachmentFileName('attachment; filename="inventory-report_2026-09.csv"', "report"),
    ).toBe("inventory-report_2026-09.csv");
    expect(attachmentFileName("attachment; filename=../../evil.pdf", "report")).toBe(".._.._evil.pdf");
    expect(attachmentFileName(null, "report.pdf")).toBe("report.pdf");
  });
});
