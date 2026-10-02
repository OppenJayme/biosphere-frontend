/**
 * Same-origin upload boundary for exhibit images.
 * It authenticates before parsing, bounds multipart requests, and forwards only allowlisted data.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addExhibitMedia } from "@/features/exhibits-qr/api";
import {
  backendMessage,
  EXHIBIT_MEDIA_MAX_BYTES,
  exhibitImageError,
  readMediaMetadataForm,
} from "@/features/exhibits-qr/form";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const runtime = "nodejs";

const MAX_MULTIPART_BYTES = EXHIBIT_MEDIA_MAX_BYTES + 128 * 1024;

type ExhibitMediaRouteContext = {
  params: Promise<{ exhibitId: string }>;
};

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function backendError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 413 || error.status === 415) {
      return json(
        {
          message:
            backendMessage(error.body) ??
            "The backend rejected this image. Use a valid JPEG, PNG, or WebP up to 15 MB.",
        },
        error.status,
      );
    }
    if (error.status === 401) return json({ message: "Your session expired." }, 401);
    if (error.status === 403) {
      return json({ message: "You do not have permission to change exhibit images." }, 403);
    }
    if (error.status === 404) return json({ message: "This exhibit no longer exists." }, 404);
  }

  return json({ message: "The image could not be saved. Try again later." }, 502);
}

export async function POST(request: Request, context: ExhibitMediaRouteContext) {
  const { exhibitId } = await context.params;
  if (!z.uuid().safeParse(exhibitId).success) {
    return json({ message: "The exhibit identifier is invalid." }, 400);
  }
  if (!(await verifySession())) return json({ message: "Your session expired." }, 401);

  const origin = request.headers.get("origin");
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin !== null && origin !== new URL(request.url).origin)
  ) {
    return json({ message: "Cross-site requests are not allowed." }, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return json({ message: "Content-Type must be multipart/form-data." }, 415);
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_MULTIPART_BYTES)) {
    return json({ message: "The image upload is too large." }, 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ message: "The multipart upload could not be read." }, 400);
  }

  const file = formData.get("file");
  const fileError = exhibitImageError(file);
  if (fileError) return json({ message: fileError }, 400);
  const metadata = readMediaMetadataForm(formData);
  if (!metadata.ok) return json({ message: metadata.message }, 400);

  // Rebuild the body so only allowlisted fields reach the backend.
  const upload = new FormData();
  upload.set("file", file as File);
  if (metadata.input.caption) upload.set("caption", metadata.input.caption);
  if (metadata.input.displayOrder !== undefined) upload.set("displayOrder", String(metadata.input.displayOrder));
  upload.set("isCover", formData.get("isCover") === "true" ? "true" : "false");

  try {
    const media = await addExhibitMedia(exhibitId, upload);
    revalidatePath("/exhibits");
    return json(media, 201);
  } catch (error) {
    return backendError(error);
  }
}
