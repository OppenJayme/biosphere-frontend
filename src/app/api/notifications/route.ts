import {
  getNotifications,
  updateNotificationState,
} from "@/features/notifications/api";
import {
  NOTIFICATION_FEED_MAX,
  notificationBulkStateRequestSchema,
  notificationStateRequestSchema,
  type NotificationBulkState,
} from "@/features/notifications/types";
import { ApiError } from "@/lib/api-client";
import { isCrossSiteRequest } from "@/lib/same-origin";

export const runtime = "nodejs";

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Backend calls in flight at once during a bulk update. */
const BULK_CONCURRENCY = 5;
/** Feed pages a bulk update will work through before stopping (10 x 100 notifications). */
const BULK_MAX_ROUNDS = 10;

/**
 * "Mark all as read" / "Clear all". The backend updates one notification per call, so this walks
 * the curator's feed a page at a time. It only acts on ids the backend just listed for this
 * curator, and it stops at the first page with a failure so a broken backend is not hammered.
 */
async function updateAll(state: NotificationBulkState) {
  let count = 0;
  let failed = 0;
  for (let round = 0; round < BULK_MAX_ROUNDS; round++) {
    const feed = await getNotifications(NOTIFICATION_FEED_MAX);
    if (!feed.stateManagementEnabled) break;
    // Read notifications stay listed, so only the unread ones are sent again.
    const targets =
      state === "READ" ? feed.items.filter((item) => !item.readAt) : feed.items;
    if (targets.length === 0) break;
    for (let start = 0; start < targets.length; start += BULK_CONCURRENCY) {
      const results = await Promise.allSettled(
        targets
          .slice(start, start + BULK_CONCURRENCY)
          .map((item) => updateNotificationState({ notificationId: item.id, state })),
      );
      for (const result of results) {
        if (result.status === "fulfilled") count += 1;
        else failed += 1;
      }
    }
    // Everything fit in this page, or marking read cannot reach older pages (read items stay listed).
    if (failed > 0 || feed.total <= feed.items.length || state === "READ") break;
  }
  return { updated: failed === 0, count, failed };
}

export async function PATCH(request: Request) {
  if (isCrossSiteRequest(request)) {
    return json({ message: "Cross-site requests are not allowed." }, 403);
  }
  if (
    !(request.headers.get("content-type") ?? "")
      .toLowerCase()
      .startsWith("application/json")
  ) {
    return json({ message: "Content-Type must be application/json." }, 415);
  }
  const text = await request.text();
  if (text.length > 2048)
    return json({ message: "Notification update is too large." }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ message: "Invalid notification update." }, 400);
  }
  const bulk = notificationBulkStateRequestSchema.safeParse(body);
  const parsed = notificationStateRequestSchema.safeParse(body);
  if (!bulk.success && !parsed.success)
    return json({ message: "Invalid notification update." }, 400);
  try {
    if (bulk.success) return json(await updateAll(bulk.data.all), 200);
    if (!parsed.success)
      return json({ message: "Invalid notification update." }, 400);
    return json(await updateNotificationState(parsed.data), 200);
  } catch (error) {
    const status =
      error instanceof ApiError && error.status >= 400 && error.status < 500
        ? error.status
        : 502;
    const message =
      status === 401
        ? "Your session expired. Sign in again."
        : status === 403
          ? "Your account cannot update notifications."
          : status === 404
            ? "This notification is no longer available. Refresh notifications."
            : "The notification update could not be confirmed. Refresh notifications or try again.";
    return json({ message }, status);
  }
}

// Lets the curator workspace (client components) read the curator feed with the
// server-held session token. `limit` is optional and bounded like the backend's.
export async function GET(request: Request) {
  const requested = Number(new URL(request.url).searchParams.get("limit"));
  const limit =
    Number.isInteger(requested) && requested >= 1 && requested <= NOTIFICATION_FEED_MAX
      ? requested
      : undefined;
  try {
    return Response.json(await getNotifications(limit), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const status =
      error instanceof ApiError && error.status >= 400 && error.status < 500
        ? error.status
        : 502;
    return Response.json(
      {
        message:
          status === 401
            ? "Your session expired. Sign in again to see notifications."
            : "Notifications could not be loaded.",
      },
      { status, headers: { "Cache-Control": "no-store" } },
    );
  }
}
