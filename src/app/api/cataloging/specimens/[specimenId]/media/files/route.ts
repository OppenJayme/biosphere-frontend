/**
 * Same-origin upload boundary for private Cataloging images.
 * It authenticates before parsing, bounds multipart requests, and forwards only allowlisted data.
 */

import { z } from "zod";
import {
  createSpecimenMedia,
  replaceSpecimenMediaFile,
} from "@/features/specimens/api";
import {
  firstMediaFormError,
  readSpecimenMediaUploadForm,
  SPECIMEN_MEDIA_MAX_BYTES,
  toSpecimenMediaUploadFormData,
} from "@/features/specimens/media-form";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const runtime = "nodejs";

const MAX_MULTIPART_BYTES = SPECIMEN_MEDIA_MAX_BYTES + 128 * 1024;

type MediaFilesRouteContext = {
  params: Promise<{ specimenId: string }>;
};

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function backendError(error: unknown, operation: "upload" | "replace") {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 413 || error.status === 415) {
      return json(
        {
          message:
            operation === "upload"
              ? "The backend rejected this image or its metadata. Use a valid JPEG, PNG, or WebP up to 15 MB."
              : "The backend rejected the replacement image. Use a valid JPEG, PNG, or WebP up to 15 MB.",
        },
        error.status,
      );
    }
    if (error.status === 401) return json({ message: "Your session expired." }, 401);
    if (error.status === 403) {
      return json({ message: "You do not have permission to change specimen media." }, 403);
    }
    if (error.status === 404) {
      return json({ message: "The specimen or media record no longer exists." }, 404);
    }
    if (error.status === 409) {
      return json({ message: "Specimen media changed concurrently. Reload and try again." }, 409);
    }
  }

  return json({ message: "The image could not be saved. Try again later." }, 502);
}

async function readBoundedUpload(request: Request) {
  const origin = request.headers.get("origin");
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin !== null && origin !== new URL(request.url).origin)
  ) {
    return { response: json({ message: "Cross-site requests are not allowed." }, 403) };
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return { response: json({ message: "Content-Type must be multipart/form-data." }, 415) };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_MULTIPART_BYTES)) {
    return { response: json({ message: "The image upload is too large." }, 413) };
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return { response: json({ message: "The multipart upload could not be read." }, 400) };
  }

  const parsed = readSpecimenMediaUploadForm(formData);
  if (!parsed.success) {
    return { response: json({ message: firstMediaFormError(parsed.error) }, 400) };
  }

  return { formData, input: parsed.data };
}

export async function POST(request: Request, context: MediaFilesRouteContext) {
  const { specimenId } = await context.params;
  if (!z.uuid().safeParse(specimenId).success) {
    return json({ message: "The specimen identifier is invalid." }, 400);
  }
  if (!(await verifySession())) return json({ message: "Your session expired." }, 401);

  const upload = await readBoundedUpload(request);
  if (upload.response) return upload.response;

  try {
    const media = await createSpecimenMedia(
      specimenId,
      toSpecimenMediaUploadFormData(upload.input),
    );
    return json(media, 201);
  } catch (error) {
    return backendError(error, "upload");
  }
}

export async function PUT(request: Request, context: MediaFilesRouteContext) {
  const { specimenId } = await context.params;
  if (!z.uuid().safeParse(specimenId).success) {
    return json({ message: "The specimen identifier is invalid." }, 400);
  }
  if (!(await verifySession())) return json({ message: "Your session expired." }, 401);

  const upload = await readBoundedUpload(request);
  if (upload.response) return upload.response;

  const mediaId = upload.formData.get("mediaId");
  if (typeof mediaId !== "string" || !z.uuid().safeParse(mediaId).success) {
    return json({ message: "The media identifier is invalid." }, 400);
  }

  const replacement = new FormData();
  replacement.set("file", upload.input.file);
  try {
    const result = await replaceSpecimenMediaFile(specimenId, mediaId, replacement);
    return json(result, 200);
  } catch (error) {
    return backendError(error, "replace");
  }
}
