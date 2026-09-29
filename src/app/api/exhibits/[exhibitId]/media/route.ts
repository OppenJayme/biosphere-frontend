/**
 * Same-origin upload boundary for public exhibit images.
 * It authenticates before parsing, bounds the multipart body, and forwards only allowlisted fields.
 */

import { addExhibitMedia } from "@/features/exhibits-qr/api";
import { backendMessage, EXHIBIT_MEDIA_MAX_BYTES, exhibitImageError } from "@/features/exhibits-qr/form";
import { guardExhibitRequest, json } from "@/features/exhibits-qr/route-helpers";
import { ApiError } from "@/lib/api-client";

export const runtime = "nodejs";

type ExhibitRouteContext = { params: Promise<{ exhibitId: string }> };

const MAX_MULTIPART_BYTES = EXHIBIT_MEDIA_MAX_BYTES + 128 * 1024;

export async function POST(request: Request, context: ExhibitRouteContext) {
  const { exhibitId } = await context.params;
  const blocked = await guardExhibitRequest(request, exhibitId);
  if (blocked) return blocked;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return json({ message: "Content-Type must be multipart/form-data." }, 415);
  }
  const contentLength = request.headers.get("content-length");
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_MULTIPART_BYTES)) {
    return json({ message: "The image must be 15 MB or smaller." }, 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ message: "The upload could not be read." }, 400);
  }

  const file = formData.get("file");
  const fileError = exhibitImageError(file);
  if (fileError) return json({ message: fileError }, 400);

  const caption = formData.get("caption");
  const trimmedCaption = typeof caption === "string" ? caption.trim() : "";
  if (trimmedCaption.length > 255) {
    return json({ message: "Captions must be 255 characters or fewer." }, 400);
  }

  const upload = new FormData();
  upload.set("file", file as File);
  if (trimmedCaption) upload.set("caption", trimmedCaption);
  if (formData.get("isCover") === "true") upload.set("isCover", "true");

  try {
    return json(await addExhibitMedia(exhibitId, upload), 201);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 400 || error.status === 413 || error.status === 415) {
        return json(
          { message: backendMessage(error.body) ?? "The image was rejected. Use a JPEG, PNG, or WebP up to 15 MB." },
          error.status,
        );
      }
      if (error.status === 401) return json({ message: "Your session expired." }, 401);
      if (error.status === 403) {
        return json({ message: "You do not have permission to change exhibit images." }, 403);
      }
      if (error.status === 404) return json({ message: "This exhibit no longer exists." }, 404);
    }
    return json({ message: "The image could not be uploaded. Try again later." }, 502);
  }
}
