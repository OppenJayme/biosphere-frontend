/**
 * Same-origin upload boundary for developer AR asset deployment (REQ-4.2-04, REQ-4.2-05).
 * It checks the developer role before parsing, bounds multipart requests, verifies the model's
 * file signature, and forwards only allowlisted fields to the backend.
 *
 * proxy.ts excludes this path from its matcher: proxy buffers at most 10 MB of a request body,
 * which would silently truncate AR models (up to 50 MB).
 */

import { createArAsset, replaceArAssetFile } from "@/features/developer/api";
import {
  firstValidationMessage,
  matchesModelSignature,
  readArAssetCreateForm,
  readArAssetReplaceForm,
  toCreateArAssetFormData,
  toReplaceArAssetFormData,
} from "@/features/developer/form";
import { getDeveloperAccess } from "@/features/developer/session";
import { AR_ASSET_MAX_BYTES, type ArModelFormat } from "@/features/developer/types";
import { ApiError } from "@/lib/api-client";

export const runtime = "nodejs";

const MAX_MULTIPART_BYTES = AR_ASSET_MAX_BYTES + 128 * 1024;

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function backendError(error: unknown, operation: "upload" | "replace") {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 413) {
      const detail =
        typeof error.body === "object" && error.body !== null && "message" in error.body
          ? (error.body as { message: unknown }).message
          : null;
      // Backend validation messages (archived exhibit, extension/format mismatch, size) are
      // written for this audience, so surface them rather than a generic line.
      return json(
        { message: typeof detail === "string" ? detail : "The backend rejected this AR model or its metadata." },
        error.status,
      );
    }
    if (error.status === 401) return json({ message: "Your session expired. Sign in and try again." }, 401);
    if (error.status === 403) {
      return json({ message: "Your account is not authorized for restricted developer functions." }, 403);
    }
    if (error.status === 404) {
      return json(
        {
          message:
            operation === "upload"
              ? "This exhibit no longer exists. Reload the list."
              : "This AR asset no longer exists. Reload the list.",
        },
        404,
      );
    }
  }
  return json({ message: "The AR model could not be deployed. Try again later." }, 502);
}

async function authorize(request: Request) {
  const origin = request.headers.get("origin");
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin !== null && origin !== new URL(request.url).origin)
  ) {
    return json({ message: "Cross-site requests are not allowed." }, 403);
  }

  const access = await getDeveloperAccess();
  if (access.state === "signed-out") return json({ message: "Your session expired. Sign in and try again." }, 401);
  if (access.state === "unavailable") return json({ message: "Your account could not be verified. Try again." }, 502);
  if (access.state !== "developer") {
    return json({ message: "Your account is not authorized for restricted developer functions." }, 403);
  }
  return null;
}

async function readBoundedMultipart(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return { response: json({ message: "Content-Type must be multipart/form-data." }, 415) };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_MULTIPART_BYTES)) {
    return { response: json({ message: "The AR model must be 50 MB or smaller." }, 413) };
  }

  try {
    return { formData: await request.formData() };
  } catch {
    return { response: json({ message: "The multipart upload could not be read." }, 400) };
  }
}

async function signatureError(file: File, format: ArModelFormat) {
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  if (matchesModelSignature(format, header)) return null;
  return json(
    {
      message:
        format === "glb"
          ? "This file is not a valid binary glTF (.glb) model."
          : "This file is not a valid USDZ package.",
    },
    400,
  );
}

export async function POST(request: Request) {
  const denied = await authorize(request);
  if (denied) return denied;

  const upload = await readBoundedMultipart(request);
  if (upload.response) return upload.response;

  const parsed = readArAssetCreateForm(upload.formData);
  if (!parsed.success) return json({ message: firstValidationMessage(parsed.error) }, 400);

  const invalid = await signatureError(parsed.data.file, parsed.data.modelFormat);
  if (invalid) return invalid;

  try {
    return json(await createArAsset(toCreateArAssetFormData(parsed.data)), 201);
  } catch (error) {
    return backendError(error, "upload");
  }
}

export async function PUT(request: Request) {
  const denied = await authorize(request);
  if (denied) return denied;

  const upload = await readBoundedMultipart(request);
  if (upload.response) return upload.response;

  const parsed = readArAssetReplaceForm(upload.formData);
  if (!parsed.success) return json({ message: firstValidationMessage(parsed.error) }, 400);

  const invalid = await signatureError(parsed.data.file, parsed.data.modelFormat);
  if (invalid) return invalid;

  try {
    return json(await replaceArAssetFile(parsed.data.assetId, toReplaceArAssetFormData(parsed.data)), 200);
  } catch (error) {
    return backendError(error, "replace");
  }
}
