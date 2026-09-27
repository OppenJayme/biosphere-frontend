/** Server-only client for published exhibit and curator QR endpoints. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import {
  curatorExhibitsSchema,
  curatorExhibitSchema,
  publicExhibitSchema,
  qrCodeInfoSchema,
  type CreateExhibitInput,
  type UpdateExhibitInput,
} from "./types";

async function parse<T>(response: unknown, schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } }, operation: string): Promise<T> {
  const result = schema.safeParse(response);
  if (!result.success) {
    throw new Error(`The backend returned an invalid ${operation} exhibit response.`);
  }
  return result.data;
}

export async function listExhibits() {
  return parse(
    await apiFetch<unknown>("/exhibits", { method: "GET", cache: "no-store" }),
    curatorExhibitsSchema,
    "curator exhibit list",
  );
}

export async function getPublishedExhibit(slug: string) {
  return parse(
    await apiFetch<unknown>(`/exhibits/public/${encodeURIComponent(slug)}`, {
      method: "GET",
      cache: "no-store",
    }),
    publicExhibitSchema,
    "published",
  );
}

export async function getExhibitQrInfo(exhibitId: string) {
  return parse(
    await apiFetch<unknown>(`/exhibits/${encodeURIComponent(exhibitId)}/qr`, {
      method: "GET",
      cache: "no-store",
    }),
    qrCodeInfoSchema,
    "QR information",
  );
}

export async function createExhibit(input: CreateExhibitInput) {
  return parse(
    await apiFetch<unknown>("/exhibits", {
      method: "POST",
      body: JSON.stringify(input),
    }),
    curatorExhibitSchema,
    "created",
  );
}

export async function updateExhibit(id: string, input: UpdateExhibitInput) {
  return parse(
    await apiFetch<unknown>(`/exhibits/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
    curatorExhibitSchema,
    "updated",
  );
}

export async function changeExhibitStatus(id: string, command: "publish" | "unpublish") {
  return parse(
    await apiFetch<unknown>(`/exhibits/${encodeURIComponent(id)}/${command}`, {
      method: "PATCH",
    }),
    curatorExhibitSchema,
    command,
  );
}