import { describe, expect, it } from "vitest";
import { VISIT_REQUEST_STATUSES, type VisitRequestStatus } from "./types";
import { hasCampusEntrySummary } from "./workflow";

const schedule = { date: "2026-11-20", startTime: "09:00", endTime: "11:00" };

describe("hasCampusEntrySummary", () => {
  it("is true only for Approved and Submitted visits with an approved schedule", () => {
    const withSummary = VISIT_REQUEST_STATUSES.filter((status: VisitRequestStatus) =>
      hasCampusEntrySummary({ status, approvedSchedule: schedule }),
    );
    expect(withSummary).toEqual(["APPROVED_BY_CURATOR", "SUBMITTED_FOR_CAMPUS_ENTRY"]);
  });

  it("is false for a Completed visit that kept its approved schedule (REQ-4.9-12)", () => {
    expect(hasCampusEntrySummary({ status: "COMPLETED", approvedSchedule: schedule })).toBe(false);
  });

  it("is false when no schedule has been approved", () => {
    expect(hasCampusEntrySummary({ status: "APPROVED_BY_CURATOR", approvedSchedule: null })).toBe(false);
  });
});
