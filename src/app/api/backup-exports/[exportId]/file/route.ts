/**
 * Same-origin, authenticated proxy that streams one export workbook to the
 * browser. No shareable link exists; the backend audits each download.
 */

import { exportFileResponse } from "@/features/backup/exports-api";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { isCrossSiteRequest } from "@/lib/same-origin";

export const runtime = "nodejs";

const PASSED_HEADERS = ["content-type", "content-disposition", "content-length"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request, { params }: { params: Promise<{ exportId: string }> }) {
  if (isCrossSiteRequest(request)) {
    return json({ message: "Cross-site requests are not allowed." }, 403);
  }
  if (!(await verifySession())) {
    return json({ message: "Your session expired. Sign in again to download exports." }, 401);
  }
  const { exportId } = await params;
  if (!UUID.test(exportId)) return json({ message: "Export not found." }, 404);

  try {
    const response = await exportFileResponse(exportId);
    const headers = new Headers({ "Cache-Control": "no-store" });
    for (const name of PASSED_HEADERS) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(response.body, { status: 200, headers });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return json({ message: "Your session expired. Sign in again to download exports." }, 401);
      }
      if (error.status === 403) {
        return json({ message: "Only active curators can download exports." }, 403);
      }
      if (error.status === 404) return json({ message: "This export has no file." }, 404);
      if (error.status === 410) {
        return json({ message: "This export was removed under the retention policy." }, 410);
      }
    }
    return json({ message: "The export file could not be downloaded. Try again later." }, 502);
  }
}
