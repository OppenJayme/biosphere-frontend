/** Same-origin, authenticated proxy that starts an Excel export now. */

import { runExportNow } from "@/features/backup/exports-api";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { isCrossSiteRequest } from "@/lib/same-origin";

export const runtime = "nodejs";

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function backendMessage(body: unknown) {
  if (!body || typeof body !== "object" || !("message" in body)) return null;
  return typeof body.message === "string" ? body.message : null;
}

export async function POST(request: Request) {
  if (isCrossSiteRequest(request)) {
    return json({ message: "Cross-site requests are not allowed." }, 403);
  }
  if (!(await verifySession())) {
    return json({ message: "Your session expired. Sign in again to run an export." }, 401);
  }
  try {
    return json(await runExportNow(), 200);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return json({ message: "Your session expired. Sign in again to run an export." }, 401);
      }
      if (error.status === 403) {
        return json({ message: "Only active curators can run an export." }, 403);
      }
      if (error.status === 409) {
        return json({ message: "An export is already running. Try again in a few minutes." }, 409);
      }
      if (error.status === 429) {
        return json({ message: "Too many exports were started recently. Wait a few minutes and try again." }, 429);
      }
      return json(
        { message: backendMessage(error.body) ?? "The export failed. Nothing was saved; see the list below." },
        error.status >= 400 && error.status < 600 ? error.status : 502,
      );
    }
    return json({ message: "The export could not be started. Try again later." }, 502);
  }
}
