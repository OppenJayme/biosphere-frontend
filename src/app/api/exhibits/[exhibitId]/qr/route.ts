/**
 * Same-origin download boundary for exhibit QR codes and printable labels.
 * The backend endpoints need the curator's bearer token, which never reaches the browser, so the
 * image is fetched server-side and streamed through unchanged.
 */

import { z } from "zod";
import { getExhibitQrFile, type ExhibitQrFile } from "@/features/exhibits-qr/api";
import { backendMessage } from "@/features/exhibits-qr/form";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const runtime = "nodejs";

type ExhibitQrRouteContext = {
  params: Promise<{ exhibitId: string }>;
};

const FILES = ["qr-png", "qr-svg", "label"] as const satisfies readonly ExhibitQrFile[];

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function backendError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return json({ message: "Your session expired. Sign in and try again." }, 401);
    if (error.status === 403) return json({ message: "You do not have permission to download QR codes." }, 403);
    if (error.status === 404) return json({ message: "This exhibit no longer exists. Reload the list." }, 404);
    if (error.status === 400) {
      return json({ message: backendMessage(error.body) ?? "Archived exhibits have no QR code." }, 400);
    }
    // The backend refuses to encode a localhost address in production.
    if (error.status === 503) {
      return json(
        {
          message:
            "QR codes cannot be generated until the public site address is configured on the server (PUBLIC_SITE_URL).",
        },
        503,
      );
    }
  }
  return json({ message: "The QR code could not be generated. Check your connection and try again." }, 502);
}

export async function GET(request: Request, context: ExhibitQrRouteContext) {
  const { exhibitId } = await context.params;
  if (!z.uuid().safeParse(exhibitId).success) {
    return json({ message: "The exhibit identifier is invalid." }, 400);
  }

  const file = new URL(request.url).searchParams.get("file") ?? "qr-png";
  if (!(FILES as readonly string[]).includes(file)) {
    return json({ message: "Choose qr-png, qr-svg, or label." }, 400);
  }

  if (!(await verifySession())) return json({ message: "Your session expired. Sign in and try again." }, 401);

  let response: Response;
  try {
    response = await getExhibitQrFile(exhibitId, file as ExhibitQrFile);
  } catch (error) {
    return backendError(error);
  }

  const headers = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  for (const name of ["content-type", "content-disposition"]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  // An SVG opened directly could run script; the backend never emits any, but deny it regardless.
  headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  return new Response(response.body, { status: 200, headers });
}
