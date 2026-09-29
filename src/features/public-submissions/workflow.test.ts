import { describe, expect, it } from "vitest";
import { canReferInquiry, nextInquiryStatuses } from "../inquiries/workflow";
import type { VisitRequest } from "../visit-requests/types";
import { canApproveSchedule, isUpcomingVisit, nextVisitStatuses } from "../visit-requests/workflow";
import { curatorActionError } from "./errors";
import { INQUIRY_STATUS_LABELS } from "../inquiries/workflow";
import { readableHistoryMessage } from "./history";
import { parsePublicWebsiteQuery, parseSelectedId, publicWebsiteHref } from "./query";

describe("status transitions (SRS B.3)", () => {
  it("only offers the inquiry changes the backend allows", () => {
    expect(nextInquiryStatuses("PENDING")).toEqual(["REVIEWED"]);
    expect(nextInquiryStatuses("REVIEWED")).toEqual(["CLOSED"]);
    expect(nextInquiryStatuses("CLOSED")).toEqual([]);
    expect(nextInquiryStatuses("TURNED_TO_VISIT_REQUEST")).toEqual([]);
    expect(canReferInquiry("PENDING") && canReferInquiry("REVIEWED")).toBe(true);
    expect(canReferInquiry("CLOSED")).toBe(false);
  });

  it("only offers the visit-request changes the backend allows", () => {
    expect(nextVisitStatuses("PENDING")).toEqual(["DECLINED", "CANCELLED"]);
    expect(nextVisitStatuses("APPROVED_BY_CURATOR")).toEqual(["SUBMITTED_FOR_CAMPUS_ENTRY", "DECLINED", "CANCELLED"]);
    expect(nextVisitStatuses("SUBMITTED_FOR_CAMPUS_ENTRY")).toEqual(["COMPLETED"]);
    for (const final of ["DECLINED", "CANCELLED", "COMPLETED"] as const) {
      expect(nextVisitStatuses(final)).toEqual([]);
    }
    expect(canApproveSchedule("PENDING")).toBe(true);
    expect(canApproveSchedule("APPROVED_BY_CURATOR")).toBe(false);
  });

  it("counts only approved visits from today onward as upcoming", () => {
    const visit = (status: VisitRequest["status"], date: string | null) =>
      ({ status, approvedSchedule: date ? { date, startTime: "09:00", endTime: "10:00" } : null }) as VisitRequest;
    expect(isUpcomingVisit(visit("APPROVED_BY_CURATOR", "2026-09-29"), "2026-09-29")).toBe(true);
    expect(isUpcomingVisit(visit("SUBMITTED_FOR_CAMPUS_ENTRY", "2026-10-01"), "2026-09-29")).toBe(true);
    expect(isUpcomingVisit(visit("APPROVED_BY_CURATOR", "2026-09-28"), "2026-09-29")).toBe(false);
    expect(isUpcomingVisit(visit("COMPLETED", "2026-10-01"), "2026-09-29")).toBe(false);
    expect(isUpcomingVisit(visit("PENDING", null), "2026-09-29")).toBe(false);
  });
});

describe("curator page query", () => {
  it("drops statuses that don't belong to the tab and caps search", () => {
    expect(parsePublicWebsiteQuery({ tab: "visits", status: "REVIEWED" })).toEqual({
      tab: "visits",
      status: "",
      search: "",
    });
    expect(parsePublicWebsiteQuery({ status: "CLOSED", search: ` ${"a".repeat(150)} ` })).toEqual({
      tab: "inquiries",
      status: "CLOSED",
      search: "a".repeat(100),
    });
  });

  it("accepts only UUID selections and round-trips hrefs", () => {
    expect(parseSelectedId({ selected: "../../etc" })).toBeUndefined();
    const id = "5589315f-81fb-49a7-8b1c-df177703e1de";
    expect(parseSelectedId({ selected: id })).toBe(id);
    expect(publicWebsiteHref({ tab: "visits", status: "PENDING", search: "cebu" }, { selected: id })).toBe(
      `/public-website?tab=visits&status=PENDING&search=cebu&selected=${id}`,
    );
    expect(publicWebsiteHref({ tab: "inquiries" })).toBe("/public-website");
  });
});

describe("curatorActionError", () => {
  it("maps backend statuses to curator-facing messages", () => {
    expect(curatorActionError({ status: 400, body: {} }, "visit-status")).toMatch(/isn't allowed/);
    expect(curatorActionError({ status: 409, body: {} }, "approve-schedule")).toMatch(/at the same time/);
    expect(curatorActionError({ status: 403, body: {} }, "inquiry-note")).toMatch(/Only curators/);
    expect(curatorActionError(null, "referral")).toMatch(/Check your connection/);
  });

  it("includes the backend's reason for rejected referrals", () => {
    const message = curatorActionError(
      { status: 400, body: { message: ["preferredSchedules[0].date cannot be in the past."] } },
      "referral",
    );
    expect(message).toMatch(/cannot be in the past/);
  });
});

describe("readableHistoryMessage", () => {
  it("replaces known status values with their labels", () => {
    expect(readableHistoryMessage("Status changed from PENDING to TURNED_TO_VISIT_REQUEST.", INQUIRY_STATUS_LABELS)).toBe(
      "Status changed from Pending to Turned to Visit Request.",
    );
  });
});
