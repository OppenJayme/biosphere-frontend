/** Curator in-system alerts (SRS REQ-4.3-05/06/08, REQ-4.8-08, REQ-4.9-07). */

import { z } from "zod";
import { publicWebsiteHref } from "../public-submissions/query";

export const NOTIFICATION_TYPES = [
  "NEW_INQUIRY",
  "NEW_VISIT_REQUEST",
  "SUBMISSION_EMAIL_FAILED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// Items carry no visitor details (REQ-4.3-08): the curator opens the record to see them.
export const curatorNotificationSchema = z.object({
  id: z.string().min(1),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string().min(1),
  recordType: z.enum(["inquiry", "visit_request"]),
  recordId: z.uuid(),
  referenceCode: z.string().min(1),
  createdAt: z.string().min(1),
  readAt: z.iso.datetime().nullable().optional(),
});

export const notificationFeedSchema = z
  .object({
    stateManagementEnabled: z.boolean().default(false),
    unreadTotal: z.number().int().nonnegative().optional(),
    total: z.number().int().nonnegative(),
    pendingInquiries: z.number().int().nonnegative(),
    pendingVisitRequests: z.number().int().nonnegative(),
    emailFailures: z.number().int().nonnegative(),
    items: z.array(curatorNotificationSchema),
  })
  .superRefine((feed, context) => {
    if (
      feed.stateManagementEnabled &&
      (feed.unreadTotal === undefined || feed.unreadTotal > feed.total)
    ) {
      context.addIssue({ code: "custom", message: "Invalid unread count" });
    }
  });

export const notificationStateRequestSchema = z
  .object({
    notificationId: z
      .string()
      .max(180)
      .regex(
        /^(NEW_INQUIRY|NEW_VISIT_REQUEST|SUBMISSION_EMAIL_FAILED):[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/,
      ),
    state: z.enum(["READ", "DISMISSED"]),
  })
  .strict();
export type NotificationStateRequest = z.infer<
  typeof notificationStateRequestSchema
>;

export type CuratorNotification = z.infer<typeof curatorNotificationSchema>;
export type NotificationFeed = z.infer<typeof notificationFeedSchema>;

/** Opens the related record on the Public Website page (REQ-4.3-06). */
export function notificationHref(
  item: Pick<CuratorNotification, "recordType" | "recordId">,
) {
  return publicWebsiteHref(
    { tab: item.recordType === "inquiry" ? "inquiries" : "visits" },
    { selected: item.recordId },
  );
}

/** Short count for the bell badge. */
export function notificationBadge(total: number) {
  if (total <= 0) return "";
  return total > 99 ? "99+" : String(total);
}
