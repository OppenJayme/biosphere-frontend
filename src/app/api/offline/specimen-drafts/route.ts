import { ApiError, apiFetch } from "@/lib/api-client";
import {
  syncSpecimenDraftRequestSchema,
  syncSpecimenDraftResultSchema,
} from "@/features/offline/schema";

export const runtime = "nodejs";

const MAX_REQUEST_CHARACTERS = 64 * 1024;

function json(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function backendMessage(body: unknown): string | string[] | null {
  if (!body || typeof body !== "object" || !("message" in body)) return null;
  const message = body.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
    return message;
  }
  return null;
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return json({ message: "Cross-site requests are not allowed." }, 403);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json({ message: "Content-Type must be application/json." }, 415);
  }

  const text = await request.text();
  if (text.length > MAX_REQUEST_CHARACTERS) {
    return json({ message: "The offline draft payload is too large." }, 413);
  }

  let untrustedBody: unknown;
  try {
    untrustedBody = JSON.parse(text);
  } catch {
    return json({ message: "The request body must contain valid JSON." }, 400);
  }

  const parsed = syncSpecimenDraftRequestSchema.safeParse(untrustedBody);
  if (!parsed.success) {
    return json(
      {
        message: parsed.error.issues.map((issue) => issue.message),
      },
      400,
    );
  }

  try {
    const result = await apiFetch<unknown>("/offline-sync/specimen-drafts", {
      method: "POST",
      cache: "no-store",
      body: JSON.stringify(parsed.data),
    });
    const validated = syncSpecimenDraftResultSchema.safeParse(result);
    if (!validated.success) {
      return json({ message: "The backend returned an invalid sync response." }, 502);
    }
    return json(validated.data, 200);
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      const message =
        status === 502
          ? "The BioSphere backend is temporarily unavailable."
          : (backendMessage(error.body) ?? "The backend rejected this draft.");
      return json({ message }, status);
    }
    return json({ message: "The BioSphere backend is temporarily unavailable." }, 502);
  }
}
