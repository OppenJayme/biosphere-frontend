import { describe, expect, it } from "vitest";
import { notificationBadge, notificationFeedSchema, notificationHref } from "./types";

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
});
