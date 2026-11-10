/** Curator in-system alerts (SRS REQ-4.3-05/06/08, REQ-4.8-08, REQ-4.9-07). */

import { z } from "zod";
import { publicWebsiteHref } from "../public-submissions/query";
import { LOCAL_SYNC_ALERT_HREF } from "./local-alerts";

// This enum is strict: an unknown type makes the whole feed fail to parse, so add a type here
// before the backend can emit it. SYNC_FAILED, BACKUP_FAILED and REPORT_FAILED are the
// operational alerts of REQ-4.3-05/10 (backend branch feat/operational-notifications-20261105).
// SYNC_FAILED covers server rejections only; offline/network failures never reach the
// server and stay device-local (see local-alerts.ts).
// The SPECIMEN_*, LOT_* and RECORD_INCOMPLETE types are the team's 2026-11-06 activity alerts
// (backend branch feat/activity-notifications-20261106); their recordId is a specimen id.
export const NOTIFICATION_TYPES = [
  "NEW_INQUIRY",
  "NEW_VISIT_REQUEST",
  "SUBMISSION_EMAIL_FAILED",
  "SYNC_FAILED",
  "BACKUP_FAILED",
  "REPORT_FAILED",
  "SPECIMEN_ARCHIVED",
  "SPECIMEN_RESTORED",
  "LOT_MOVED",
  "LOT_DEACCESSIONED",
  "LOT_MISSING_LOSS",
  "RECORD_INCOMPLETE",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * Specimen and lot changes made by another curator. Informational: the backend drops them
 * after 7 calendar days, and the acting curator never receives their own.
 */
export const CHANGE_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "SPECIMEN_ARCHIVED",
  "SPECIMEN_RESTORED",
  "LOT_MOVED",
  "LOT_DEACCESSIONED",
  "LOT_MISSING_LOSS",
];

/** Change events whose detail lives on the specimen's lots page. */
const LOT_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "LOT_MOVED",
  "LOT_DEACCESSIONED",
  "LOT_MISSING_LOSS",
];

/** Alerts about something that went wrong, shown with a warning style. */
export const FAILURE_NOTIFICATION_TYPES: readonly NotificationType[] = [
  "SUBMISSION_EMAIL_FAILED",
  "SYNC_FAILED",
  "BACKUP_FAILED",
  "REPORT_FAILED",
];

export const NOTIFICATION_RECORD_TYPES = [
  "inquiry",
  "visit_request",
  // recordId is the clientDraftId of the offline draft the server rejected.
  "offline_draft",
  "backup_history",
  // recordId is the report-history entry id from GET /reports/history.
  "report",
  // recordId is the specimen id, including for LOT_* events.
  "specimen",
] as const;

// Items carry no visitor details (REQ-4.3-08): the curator opens the record to see them.
export const curatorNotificationSchema = z.object({
  id: z.string().min(1),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string().min(1),
  recordType: z.enum(NOTIFICATION_RECORD_TYPES),
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
    // Unresolved operational failures; like emailFailures it does not drop on dismiss.
    // Defaults to 0 for backends that predate operational alerts.
    operationalAlerts: z.number().int().nonnegative().default(0),
    // Recent specimen/lot changes by other curators, and specimens Uncataloged for more than
    // 7 days. Neither drops on dismiss. Default to 0 for older backends.
    changeEvents: z.number().int().nonnegative().default(0),
    incompleteRecords: z.number().int().nonnegative().default(0),
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

// "TYPE:<uuid>", built from NOTIFICATION_TYPES so the two lists cannot drift apart.
const NOTIFICATION_ID_PATTERN = new RegExp(
  `^(${NOTIFICATION_TYPES.join("|")}):[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$`,
);

export const notificationStateRequestSchema = z
  .object({
    notificationId: z.string().max(180).regex(NOTIFICATION_ID_PATTERN),
    state: z.enum(["READ", "DISMISSED"]),
  })
  .strict();
export type NotificationStateRequest = z.infer<
  typeof notificationStateRequestSchema
>;

export type CuratorNotification = z.infer<typeof curatorNotificationSchema>;
export type NotificationFeed = z.infer<typeof notificationFeedSchema>;

/**
 * Opens the related record or module (REQ-4.3-06). Backup and report history have no
 * single-entry view, so those open the module's existing "failed" filter. Specimen alerts
 * open the specimen, and lot events open its lots page.
 */
export function notificationHref(
  item: Pick<CuratorNotification, "recordType" | "recordId"> &
    Partial<Pick<CuratorNotification, "type">>,
) {
  switch (item.recordType) {
    case "inquiry":
    case "visit_request":
      return publicWebsiteHref(
        { tab: item.recordType === "inquiry" ? "inquiries" : "visits" },
        { selected: item.recordId },
      );
    case "offline_draft":
      return LOCAL_SYNC_ALERT_HREF;
    case "backup_history":
      return "/backup-history?status=FAILED";
    case "report":
      return "/reports?historyResult=FAILED#report-history";
    case "specimen": {
      const specimen = `/specimens/${encodeURIComponent(item.recordId)}`;
      return item.type && LOT_NOTIFICATION_TYPES.includes(item.type) ? `${specimen}/lots` : specimen;
    }
  }
}

export function isFailureNotification(type: NotificationType) {
  return FAILURE_NOTIFICATION_TYPES.includes(type);
}

export function isChangeNotification(type: NotificationType) {
  return CHANGE_NOTIFICATION_TYPES.includes(type);
}

/** Short count for the bell badge. */
export function notificationBadge(total: number) {
  if (total <= 0) return "";
  return total > 99 ? "99+" : String(total);
}
