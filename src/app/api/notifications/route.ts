import { getNotifications } from "@/features/notifications/api";
import { ApiError } from "@/lib/api-client";

export const runtime = "nodejs";

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
