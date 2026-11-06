import { describe, expect, it } from "vitest";
import {
  isChangeNotification,
  isFailureNotification,
  notificationBadge,
  notificationFeedSchema,
  notificationHref,
  notificationStateRequestSchema,
} from "./types";

const id = "5589315f-81fb-49a7-8b1c-df177703e1de";

describe("curator notifications", () => {
  it("opens the related record on the right tab", () => {
    expect(notificationHref({ recordType: "inquiry", recordId: id })).toBe(`/public-website?selected=${id}`);
    expect(notificationHref({ recordType: "visit_request", recordId: id })).toBe(
      `/public-website?tab=visits&selected=${id}`,
    );
  });

  it("caps the badge and hides it at zero", () => {
    expect(notificationBadge(0)).toBe("");
    expect(notificationBadge(7)).toBe("7");
    expect(notificationBadge(120)).toBe("99+");
  });

  it("accepts the backend feed and rejects an unknown type", () => {
    const item = {
      id: `SUBMISSION_EMAIL_FAILED:ALERT_CURATORS:${id}`,
      type: "SUBMISSION_EMAIL_FAILED",
      title: "Curator alert email was not delivered",
      recordType: "visit_request",
      recordId: id,
      referenceCode: "5589315F",
      createdAt: "2026-10-01T06:05:00.000Z",
    };
    const feed = { total: 1, pendingInquiries: 0, pendingVisitRequests: 1, emailFailures: 1, items: [item] };
    expect(notificationFeedSchema.safeParse(feed).success).toBe(true);
    expect(
      notificationFeedSchema.safeParse({ ...feed, items: [{ ...item, type: "SOMETHING_ELSE" }] }).success,
    ).toBe(false);
  });

  it("accepts the operational alert types and defaults operationalAlerts for older backends", () => {
    const items = [
      ["SYNC_FAILED", "offline_draft"],
      ["BACKUP_FAILED", "backup_history"],
      ["REPORT_FAILED", "report"],
    ].map(([type, recordType]) => ({
      id: `${type}:${id}`,
      type,
      title: "Operational failure",
      recordType,
      recordId: id,
      referenceCode: "5589315F",
      createdAt: "2026-11-05T06:05:00.000Z",
    }));
    const base = { total: 3, pendingInquiries: 0, pendingVisitRequests: 0, emailFailures: 0, items };
    const parsed = notificationFeedSchema.safeParse({ ...base, operationalAlerts: 3 });
    expect(parsed.success && parsed.data.operationalAlerts).toBe(3);
    const legacy = notificationFeedSchema.safeParse(base);
    expect(legacy.success && legacy.data.operationalAlerts).toBe(0);
  });

  it("links operational alerts to their module", () => {
    expect(notificationHref({ recordType: "offline_draft", recordId: id })).toBe("/specimens#offline-records-heading");
    expect(notificationHref({ recordType: "backup_history", recordId: id })).toBe("/backup-history?status=FAILED");
    expect(notificationHref({ recordType: "report", recordId: id })).toBe("/reports?historyResult=FAILED#report-history");
  });

  it("allows read/dismiss requests for operational alerts only with a known type", () => {
    for (const type of ["SYNC_FAILED", "BACKUP_FAILED", "REPORT_FAILED"]) {
      expect(notificationStateRequestSchema.safeParse({ notificationId: `${type}:${id}`, state: "DISMISSED" }).success).toBe(true);
    }
    expect(notificationStateRequestSchema.safeParse({ notificationId: `OTHER_FAILED:${id}`, state: "READ" }).success).toBe(false);
  });

  it("marks failure types for the warning style", () => {
    expect(isFailureNotification("BACKUP_FAILED")).toBe(true);
    expect(isFailureNotification("NEW_INQUIRY")).toBe(false);
  });

  const ACTIVITY_TYPES = [
    "SPECIMEN_ARCHIVED",
    "SPECIMEN_RESTORED",
    "LOT_MOVED",
    "LOT_DEACCESSIONED",
    "LOT_MISSING_LOSS",
    "RECORD_INCOMPLETE",
  ] as const;

  it("accepts the specimen activity types and defaults their counts for older backends", () => {
    const items = ACTIVITY_TYPES.map((type) => ({
      id: `${type}:${id}`,
      type,
      title: "Specimen activity",
      recordType: "specimen",
      recordId: id,
      referenceCode: "USC-BM-2026-0001",
      createdAt: "2026-11-06T02:00:00.000Z",
    }));
    const base = { total: 6, pendingInquiries: 0, pendingVisitRequests: 0, emailFailures: 0, items };
    const parsed = notificationFeedSchema.safeParse({ ...base, changeEvents: 5, incompleteRecords: 1 });
    expect(parsed.success && [parsed.data.changeEvents, parsed.data.incompleteRecords]).toEqual([5, 1]);
    const legacy = notificationFeedSchema.safeParse(base);
    expect(legacy.success && [legacy.data.changeEvents, legacy.data.incompleteRecords]).toEqual([0, 0]);
  });

  it("opens the specimen, or its lots page for lot events", () => {
    for (const type of ["SPECIMEN_ARCHIVED", "SPECIMEN_RESTORED", "RECORD_INCOMPLETE"] as const) {
      expect(notificationHref({ type, recordType: "specimen", recordId: id })).toBe(`/specimens/${id}`);
    }
    for (const type of ["LOT_MOVED", "LOT_DEACCESSIONED", "LOT_MISSING_LOSS"] as const) {
      expect(notificationHref({ type, recordType: "specimen", recordId: id })).toBe(`/specimens/${id}/lots`);
    }
  });

  it("allows read/dismiss requests for every activity type", () => {
    for (const type of ACTIVITY_TYPES) {
      expect(notificationStateRequestSchema.safeParse({ notificationId: `${type}:${id}`, state: "READ" }).success).toBe(true);
    }
    expect(notificationStateRequestSchema.safeParse({ notificationId: `LOT_MOVED:not-a-uuid`, state: "READ" }).success).toBe(false);
  });

  it("separates change events from failures", () => {
    expect(isChangeNotification("LOT_MOVED")).toBe(true);
    expect(isChangeNotification("RECORD_INCOMPLETE")).toBe(false);
    expect(isFailureNotification("SPECIMEN_ARCHIVED")).toBe(false);
  });
});
