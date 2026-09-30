/** Server-only client for the restricted /developer endpoints (backend role: DEVELOPER). */

import "server-only";
import type { z } from "zod";
import { apiFetch } from "@/lib/api-client";
import type { CuratorStatusInput, OnboardCuratorInput } from "./form";
import {
  arAssetRemovedSchema,
  arAssetSchema,
  arExhibitListSchema,
  curatorAccountListSchema,
  curatorAccountSchema,
} from "./types";

function parse<T extends z.ZodType>(schema: T, response: unknown, operation: string): z.output<T> {
  const result = schema.safeParse(response);
  if (!result.success) {
    throw new Error(`The backend returned an invalid ${operation} response.`);
  }
  return result.data;
}

const arAssetPath = (id: string) => `/developer/ar-assets/${encodeURIComponent(id)}`;

export async function listCuratorAccounts() {
  const response = await apiFetch<unknown>("/developer/curators", {
    method: "GET",
    cache: "no-store",
  });
  return parse(curatorAccountListSchema, response, "curator account list");
}

export async function onboardCurator(input: OnboardCuratorInput) {
  const response = await apiFetch<unknown>("/developer/curators/onboard", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parse(curatorAccountSchema, response, "curator onboarding");
}

export async function updateCuratorStatus(id: string, input: CuratorStatusInput) {
  const response = await apiFetch<unknown>(`/developer/curators/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return parse(curatorAccountSchema, response, "curator status");
}

export async function listArExhibits() {
  const response = await apiFetch<unknown>("/developer/ar-exhibits", {
    method: "GET",
    cache: "no-store",
  });
  return parse(arExhibitListSchema, response, "AR exhibit list");
}

export async function createArAsset(body: FormData) {
  const response = await apiFetch<unknown>("/developer/ar-assets", { method: "POST", body });
  return parse(arAssetSchema, response, "AR asset upload");
}

export async function replaceArAssetFile(id: string, body: FormData) {
  const response = await apiFetch<unknown>(arAssetPath(id), { method: "PATCH", body });
  return parse(arAssetSchema, response, "AR asset replacement");
}

/** Activation must carry the documented authorization, which the backend audits (REQ-4.2-05). */
export async function activateArAsset(id: string, authorizationReference: string) {
  const response = await apiFetch<unknown>(`${arAssetPath(id)}/activate`, {
    method: "PATCH",
    body: JSON.stringify({ authorizationReference }),
  });
  return parse(arAssetSchema, response, "AR asset activation");
}

export async function deactivateArAsset(id: string) {
  const response = await apiFetch<unknown>(`${arAssetPath(id)}/deactivate`, { method: "PATCH" });
  return parse(arAssetSchema, response, "AR asset deactivation");
}

export async function removeArAsset(id: string) {
  const response = await apiFetch<unknown>(arAssetPath(id), { method: "DELETE" });
  return parse(arAssetRemovedSchema, response, "AR asset removal");
}
