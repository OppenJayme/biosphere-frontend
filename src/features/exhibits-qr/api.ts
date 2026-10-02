/** Server-only client for curator exhibit endpoints and the public QR exhibit page. */

import "server-only";
import { z } from "zod";
import { apiFetch, ApiError } from "@/lib/api-client";
import { env } from "@/lib/env";
import type { CreateExhibitInput, MediaMetadataInput, UpdateExhibitInput } from "./form";
import {
  exhibitListSchema,
  exhibitMediaSchema,
  exhibitSchema,
  exhibitSummaryListSchema,
  publicExhibitSchema,
  type ExhibitListQuery,
  type PublicExhibit,
} from "./types";

const API_URL = process.env.API_URL ?? env.NEXT_PUBLIC_API_URL;

function parse<T>(schema: z.ZodType<T>, response: unknown, operation: string): T {
  const result = schema.safeParse(response);
  if (!result.success) {
    throw new Error(`The backend returned an invalid ${operation} exhibit response.`);
  }
  return result.data;
}

const exhibitPath = (id: string) => `/exhibits/${encodeURIComponent(id)}`;

export async function listExhibits(query: Partial<ExhibitListQuery> = {}) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.ar) params.set("arEnabled", String(query.ar === "on"));
  if (query.search) params.set("search", query.search);
  const search = params.toString();

  const response = await apiFetch<unknown>(`/exhibits${search ? `?${search}` : ""}`, {
    method: "GET",
    cache: "no-store",
  });
  return parse(exhibitListSchema, response, "list");
}

/** Status-only exhibit list for the dashboard's QR readiness summary. */
export async function listExhibitSummaries() {
  const response = await apiFetch<unknown>("/exhibits", { method: "GET", cache: "no-store" });
  return parse(exhibitSummaryListSchema, response, "summary list");
}

export async function getExhibit(id: string) {
  const response = await apiFetch<unknown>(exhibitPath(id), { method: "GET", cache: "no-store" });
  return parse(exhibitSchema, response, "detail");
}

export async function createExhibit(input: CreateExhibitInput) {
  const response = await apiFetch<unknown>("/exhibits", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parse(exhibitSchema, response, "created");
}

export async function updateExhibit(id: string, input: UpdateExhibitInput) {
  const response = await apiFetch<unknown>(exhibitPath(id), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return parse(exhibitSchema, response, "updated");
}

/** Intentional URL change: QR codes printed for the old URL stop working (REQ-4.12-10). */
export async function replaceExhibitUrl(id: string, publicSlug: string) {
  const response = await apiFetch<unknown>(`${exhibitPath(id)}/replace-url`, {
    method: "PATCH",
    body: JSON.stringify({ publicSlug }),
  });
  return parse(exhibitSchema, response, "replaced");
}

export type ExhibitLifecycleCommand = "publish" | "unpublish" | "disable" | "archive";

export async function changeExhibitStatus(id: string, command: ExhibitLifecycleCommand) {
  const response = await apiFetch<unknown>(`${exhibitPath(id)}/${command}`, { method: "PATCH" });
  return parse(exhibitSchema, response, command);
}

/** Curator on/off switch for developer-uploaded AR assets (REQ-4.13-02). */
export async function setExhibitAr(id: string, enabled: boolean) {
  const response = await apiFetch<unknown>(`${exhibitPath(id)}/ar`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
  return parse(exhibitSchema, response, "AR");
}

export async function addExhibitMedia(id: string, formData: FormData) {
  const response = await apiFetch<unknown>(`${exhibitPath(id)}/media`, {
    method: "POST",
    body: formData,
  });
  return parse(exhibitMediaSchema, response, "uploaded media");
}

export async function updateExhibitMedia(
  id: string,
  mediaId: string,
  input: MediaMetadataInput | { isCover: true },
) {
  const response = await apiFetch<unknown>(`${exhibitPath(id)}/media/${encodeURIComponent(mediaId)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return parse(exhibitMediaSchema, response, "updated media");
}

export async function removeExhibitMedia(id: string, mediaId: string) {
  await apiFetch<unknown>(`${exhibitPath(id)}/media/${encodeURIComponent(mediaId)}`, {
    method: "DELETE",
  });
}

/**
 * Public QR page content. Sent without the curator token, so a signed-in curator sees exactly
 * what a visitor sees. Returns null for every "unavailable" case (missing, unpublished, disabled,
 * archived); the backend gives them the same 404 (REQ-4.12-09).
 */
export async function getPublicExhibit(slug: string): Promise<PublicExhibit | null> {
  const response = await fetch(`${API_URL}/exhibits/public/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new ApiError(response.status, await response.json().catch(() => null));
  }
  return parse(publicExhibitSchema, await response.json(), "public");
}
