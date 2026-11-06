import { describe, expect, it } from "vitest";
import type { VisitRequest, VisitRequestStatus } from "./types";
import { hasCampusEntrySummary } from "./workflow";

const schedule = { date: "2026-11-20", startTime: "09:00", endTime: "11:00" } as VisitRequest["approvedSchedule"];

function visit(status: VisitRequestStatus, approvedSchedule: VisitRequest["approvedSchedule"] = schedule) {
  return { status, approvedSchedule };
}

describe("hasCampusEntrySummary", () => {
  it.each<VisitRequestStatus>(["APPROVED_BY_CURATOR", "SUBMITTED_FOR_CAMPUS_ENTRY"])(
    "offers the summary for a %s visit with an approved schedule",
    (status) => {
      expect(hasCampusEntrySummary(visit(status))).toBe(true);
    },
  );

  // VRM-02: these keep their approved schedule, but the backend answers 400 for their summary.
  it.each<VisitRequestStatus>(["COMPLETED", "DECLINED", "CANCELLED"])(
    "does not request the summary for a %s visit even though a schedule was approved",
    (status) => {
      expect(hasCampusEntrySummary(visit(status))).toBe(false);
    },
  );

  it("does not request the summary before a schedule is approved", () => {
    expect(hasCampusEntrySummary(visit("PENDING", null))).toBe(false);
    expect(hasCampusEntrySummary(visit("APPROVED_BY_CURATOR", null))).toBe(false);
  });
});
