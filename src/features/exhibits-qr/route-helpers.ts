/** Shared guards for the same-origin exhibit Route Handlers (QR/label downloads, image uploads). */

import "server-only";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import type { ExhibitImageFile } from "./qr-api";

export function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export function isCrossSite(request: Request) {
  const origin = request.headers.get("origin");
  return (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin !== null && origin !== new URL(request.url).origin)
  );
}

/** Returns an error Response, or null when the request may continue. */
export async function guardExhibitRequest(request: Request, exhibitId: string) {
  if (isCrossSite(request)) return json({ message: "Cross-site requests are not allowed." }, 403);
  if (!z.uuid().safeParse(exhibitId).success) {
    return json({ message: "The exhibit identifier is invalid." }, 400);
  }
  if (!(await verifySession())) return json({ message: "Your session expired." }, 401);
  return null;
}

/**
 * Serves a backend QR/label image from this origin. SVG is a document that could carry script, so
 * it is locked down with a CSP that allows only inline styles and data: images.
 */
export function imageResponse(file: ExhibitImageFile, download: boolean) {
  return new Response(file.body, {
    status: 200,
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${file.fileName}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}

export function qrErrorResponse(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return json({ message: "Archived exhibits no longer have a QR code or label." }, 400);
    }
    if (error.status === 401) return json({ message: "Your session expired." }, 401);
    if (error.status === 403) {
      return json({ message: "You do not have permission to download exhibit QR codes." }, 403);
    }
    if (error.status === 404) return json({ message: "This exhibit no longer exists." }, 404);
    if (error.status === 503) {
      return json(
        {
          message:
            "QR codes cannot be generated until the public website address (PUBLIC_SITE_URL) is configured on the server.",
        },
        503,
      );
    }
  }
  return json({ message: "The QR code could not be generated. Try again later." }, 502);
}
