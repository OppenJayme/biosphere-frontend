import { describe, expect, it } from "vitest";
import { describeReportParameters } from "./history";
import { parseReportHistoryQuery, reportHistoryHref } from "./query";

describe("report history query", () => {
  it("keeps supported filters and builds a stable URL", () => {
    const query = parseReportHistoryQuery({
      historyType: "INVENTORY",
      historyResult: "FAILED",
      historyPage: "3",
      historyLimit: "25",
    });

    expect(query).toEqual({ type: "INVENTORY", result: "FAILED", page: 3, limit: 25 });
    expect(reportHistoryHref(query)).toBe(
      "/reports?historyType=INVENTORY&historyResult=FAILED&historyLimit=25&historyPage=3#report-history",
    );
    expect(reportHistoryHref(query, 1)).toBe(
      "/reports?historyType=INVENTORY&historyResult=FAILED&historyLimit=25#report-history",
    );
  });

  it("drops unsupported values", () => {
    const query = parseReportHistoryQuery({
      historyType: "AUDIT_LOG",
      historyResult: "DENIED",
      historyPage: "-2",
      historyLimit: "999",
    });

    expect(query).toEqual({ type: "", result: "", page: 1, limit: 10 });
    expect(reportHistoryHref(query)).toBe("/reports");
  });
});

describe("report history parameters", () => {
  it("summarizes the period and filters in plain words", () => {
    const labels = new Map([["d0000000-0000-4000-8000-000000000001", "Room 101 › Cabinet A"]]);

    expect(
      describeReportParameters(
        {
          periodLabel: "September 2026",
          filters: {
            visitStatus: "APPROVED_BY_CURATOR",
            storageUnitId: "d0000000-0000-4000-8000-000000000001",
            includeDescendantUnits: false,
            remarks: true,
          },
        },
        labels,
      ),
    ).toBe(
      "September 2026 · Status: Approved by curator · Storage location: Room 101 › Cabinet A · Include sub-locations: No · Remarks: Included",
    );
    expect(describeReportParameters({ periodLabel: null, filters: {} })).toBe("No filters");
  });
});
