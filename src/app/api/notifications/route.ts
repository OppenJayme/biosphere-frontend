import {
  getNotifications,
  updateNotificationState,
} from "@/features/notifications/api";
import { notificationStateRequestSchema } from "@/features/notifications/types";
import { ApiError } from "@/lib/api-client";
import { isCrossSiteRequest } from "@/lib/same-origin";

export const runtime = "nodejs";

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
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
  const parsed = notificationStateRequestSchema.safeParse(body);
  if (!parsed.success)
    return json({ message: "Invalid notification update." }, 400);
  try {
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

// Lets the topbar bell (a client component) read the curator feed with the
// server-held session token.
export async function GET() {
  try {
    return Response.json(await getNotifications(), {
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
