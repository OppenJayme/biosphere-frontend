import { describe, expect, it } from "vitest";
import {
  backupDateBounds,
  backupDateRangeError,
  backupHistoryHref,
  parseBackupHistoryQuery,
} from "./query";

describe("backup-history query handling", () => {
  it("keeps supported filters and creates a stable page URL", () => {
    const query = parseBackupHistoryQuery({
      search: " scheduled ",
      status: "COMPLETED",
      backupType: " FULL ",
      fromDate: "2026-09-01",
      toDate: "2026-09-26",
      page: "3",
      limit: "50",
    });

    expect(query).toEqual({
      search: "scheduled",
      status: "COMPLETED",
      backupType: "FULL",
      fromDate: "2026-09-01",
      toDate: "2026-09-26",
      page: 3,
      limit: 50,
    });
    expect(backupHistoryHref(query)).toBe(
      "/backup-history?search=scheduled&status=COMPLETED&backupType=FULL&fromDate=2026-09-01&toDate=2026-09-26&limit=50&page=3",
    );
  });

  it("rejects unsupported and malformed URL values", () => {
    const query = parseBackupHistoryQuery({
      status: "UNKNOWN",
      fromDate: "2026-02-30",
      page: "-1",
      limit: "999",
    });

    expect(query.status).toBe("");
    expect(query.fromDate).toBe("");
    expect(query.page).toBe(1);
    expect(query.limit).toBe(25);
    expect(backupHistoryHref(query)).toBe("/backup-history");
  });

  it("detects reversed dates and builds inclusive Philippine-time bounds", () => {
    const reversed = parseBackupHistoryQuery({
      fromDate: "2026-09-26",
      toDate: "2026-09-01",
    });
    expect(backupDateRangeError(reversed)).toBe(
      "The start date must not be after the end date.",
    );

    const valid = parseBackupHistoryQuery({
      fromDate: "2026-09-01",
      toDate: "2026-09-26",
    });
    expect(backupDateBounds(valid)).toEqual({
      from: "2026-09-01T00:00:00.000+08:00",
      to: "2026-09-26T23:59:59.999+08:00",
    });
  });
});
