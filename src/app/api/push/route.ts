/**
 * Same-origin push registration for the curator's browser. The session token stays on the server;
 * the backend ties the device to the signed-in account, so the body carries only the endpoint.
 */
import { getPushConfig, subscribePush, unsubscribePush } from "@/features/push/api";
import { pushSubscriptionRequestSchema } from "@/features/push/types";
import { ApiError } from "@/lib/api-client";
import { isCrossSiteRequest } from "@/lib/same-origin";

export const runtime = "nodejs";

const MAX_BODY = 2048;

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function failure(error: unknown, fallback: string) {
  // 503 means the backend has push switched off; keep it so the curator is told so.
  const status =
    error instanceof ApiError && ((error.status >= 400 && error.status < 500) || error.status === 503)
      ? error.status
      : 502;
  const message =
    status === 401
      ? "Your session expired. Sign in again."
      : status === 403
        ? "Your account cannot use push notifications."
        : status === 503
          ? "Push notifications are not turned on for BioSphere."
          : status === 400
            ? "This browser's push service is not supported."
            : fallback;
  return json({ message }, status);
}

async function readEndpoint(request: Request) {
  if (isCrossSiteRequest(request)) return json({ message: "Cross-site requests are not allowed." }, 403);
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) {
    return json({ message: "Content-Type must be application/json." }, 415);
  }
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ message: "Push registration is too large." }, 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ message: "Invalid push registration." }, 400);
  }
  const parsed = pushSubscriptionRequestSchema.safeParse(body);
  return parsed.success ? parsed.data : json({ message: "Invalid push registration." }, 400);
}

export async function GET() {
  try {
    return json(await getPushConfig(), 200);
  } catch (error) {
    return failure(error, "Push settings could not be loaded.");
  }
}

export async function POST(request: Request) {
  const input = await readEndpoint(request);
  if (input instanceof Response) return input;
  try {
    return json(await subscribePush(input), 200);
  } catch (error) {
    return failure(error, "Push notifications could not be turned on. Try again.");
  }
}

export async function DELETE(request: Request) {
  const input = await readEndpoint(request);
  if (input instanceof Response) return input;
  try {
    return json(await unsubscribePush(input), 200);
  } catch (error) {
    return failure(error, "Push notifications could not be turned off. Try again.");
  }
}
