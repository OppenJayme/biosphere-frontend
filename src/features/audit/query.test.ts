import { describe, expect, it } from "vitest";
import {
  auditDateBounds,
  auditLogDateRangeError,
  auditLogListHref,
  parseAuditLogListQuery,
} from "./query";

describe("audit-log query handling", () => {
  it("keeps supported filters and builds a stable page URL", () => {
    const query = parseAuditLogListQuery({
      search: "  curator  ",
      result: "DENIED",
      module: "  auth  ",
      action: " LOGIN ",
      affectedRecordType: " user_account ",
      fromDate: "2026-09-01",
      toDate: "2026-09-24",
      page: "3",
      limit: "50",
    });

    expect(query).toEqual({
      search: "curator",
      result: "DENIED",
      module: "auth",
      action: "LOGIN",
      affectedRecordType: "user_account",
      fromDate: "2026-09-01",
      toDate: "2026-09-24",
      page: 3,
      limit: 50,
    });
    expect(auditLogListHref(query)).toBe(
      "/audit-logs?search=curator&result=DENIED&module=auth&action=LOGIN&affectedRecordType=user_account&fromDate=2026-09-01&toDate=2026-09-24&limit=50&page=3",
    );
  });

  it("falls back safely for unsupported URL values", () => {
    const query = parseAuditLogListQuery({
      result: "BROKEN",
      fromDate: "2026-02-30",
      toDate: "not-a-date",
      page: "-1",
      limit: "999",
    });

    expect(query.result).toBe("");
    expect(query.fromDate).toBe("");
    expect(query.toDate).toBe("");
    expect(query.page).toBe(1);
    expect(query.limit).toBe(25);
    expect(auditLogListHref(query)).toBe("/audit-logs");
  });

  it("detects reversed ranges before calling the backend", () => {
    const query = parseAuditLogListQuery({
      fromDate: "2026-09-24",
      toDate: "2026-09-01",
    });

    expect(auditLogDateRangeError(query)).toBe(
      "The start date must not be after the end date.",
    );
  });

  it("expands date-only filters into inclusive Philippine museum-time bounds", () => {
    const query = parseAuditLogListQuery({
      fromDate: "2026-09-01",
      toDate: "2026-09-24",
    });

    expect(auditDateBounds(query)).toEqual({
      from: "2026-09-01T00:00:00.000+08:00",
      to: "2026-09-24T23:59:59.999+08:00",
    });
  });
});
