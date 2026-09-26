/** Same-origin, authenticated and bounded multipart boundary for specimen CSV previews. */

import { previewSpecimenImport } from "@/features/specimens/import-api";
import {
  MAX_SPECIMEN_IMPORT_FILE_BYTES,
  validateImportFileMetadata,
} from "@/features/specimens/import-types";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const runtime = "nodejs";

const MAX_MULTIPART_BYTES = MAX_SPECIMEN_IMPORT_FILE_BYTES + 128 * 1024;

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function backendMessage(body: unknown) {
  if (!body || typeof body !== "object" || !("message" in body)) return null;
  const message = body.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
    return message;
  }
  return null;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin !== null && origin !== new URL(request.url).origin)
  ) {
    return json({ message: "Cross-site requests are not allowed." }, 403);
  }
  if (!(await verifySession())) return json({ message: "Your session expired." }, 401);

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return json({ message: "Content-Type must be multipart/form-data." }, 415);
  }

  const contentLength = request.headers.get("content-length");
  if (
    contentLength &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_MULTIPART_BYTES)
  ) {
    return json({ message: "The CSV upload is too large." }, 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json({ message: "The multipart upload could not be read." }, 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return json({ message: "Choose a non-empty CSV file to preview." }, 400);
  }
  const fileError = validateImportFileMetadata(file);
  if (fileError) return json({ message: fileError }, 400);

  try {
    return json(await previewSpecimenImport(file), 201);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) return json({ message: "Your session expired." }, 401);
      if (error.status === 403) {
        return json({ message: "You do not have permission to import specimens." }, 403);
      }
      if ([400, 413, 415, 429].includes(error.status)) {
        return json(
          { message: backendMessage(error.body) ?? "The backend rejected this CSV." },
          error.status,
        );
      }
    }
    return json({ message: "The CSV preview is temporarily unavailable." }, 502);
  }
}
