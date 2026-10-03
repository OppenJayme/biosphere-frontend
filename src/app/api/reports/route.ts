/**
 * Same-origin, authenticated proxy that generates a report with the
 * server-held session token and streams the file back for download.
 */

import { generateReport } from "@/features/reports/api";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 16 * 1024;
const PASSED_HEADERS = ["content-type", "content-disposition", "content-length"];

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

function backendMessage(body: unknown) {
  if (!body || typeof body !== "object" || !("message" in body)) return null;
  const message = body.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
    return message.join(" ");
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
  if (!(await verifySession())) {
    return json({ message: "Your session expired. Sign in again to generate reports." }, 401);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ message: "The report request is too large." }, 413);
  }
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ message: "The report request could not be read." }, 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return json({ message: "The report request could not be read." }, 400);
  }

  try {
    const response = await generateReport(body as Record<string, unknown>);
    const headers = new Headers({ "Cache-Control": "no-store" });
    for (const name of PASSED_HEADERS) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(response.body, { status: 200, headers });
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return json({ message: "Your session expired. Sign in again to generate reports." }, 401);
      }
      if (error.status === 403) {
        return json({ message: "Only active curators can generate reports." }, 403);
      }
      if (error.status === 429) {
        return json(
          { message: "Too many reports were generated in the last minute. Wait a moment and try again." },
          429,
        );
      }
      if (error.status >= 400 && error.status < 500) {
        return json(
          { message: backendMessage(error.body) ?? "The report request was not accepted." },
          error.status,
        );
      }
    }
    return json(
      { message: "The report could not be generated. No file was created; try again later." },
      502,
    );
  }
}
