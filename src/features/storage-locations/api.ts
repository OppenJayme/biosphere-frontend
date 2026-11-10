/** Server-only API client for the existing storage-location backend contract. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import {
  storageMovementListSchema,
  storageUnitSchema,
  storageUnitPageSchema,
  type StorageLifecycle,
  type StorageUnit,
} from "./types";
import type {
  StorageLocationMutationInput,
  StorageLocationMoveInput,
} from "./management";

const PAGE_SIZE = 100;

export async function listStorageLocations(
  lifecycle: StorageLifecycle = "ACTIVE",
): Promise<StorageUnit[]> {
  const items: StorageUnit[] = [];
  let page = 1;
  let total = 0;

  // The hierarchy needs every matching parent and child, so consume the
  // backend's bounded search pages instead of relying on its legacy unbounded list.
  do {
    const query = new URLSearchParams({
      lifecycle,
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    const response = await apiFetch<unknown>(`/storage-locations/search?${query}`, {
      method: "GET",
      cache: "no-store",
    });
    const result = storageUnitPageSchema.safeParse(response);

    if (!result.success || result.data.page !== page) {
      throw new Error("The backend returned an invalid storage location response.");
    }

    total = result.data.total;
    items.push(...result.data.items);

    if (result.data.items.length === 0 && items.length < total) {
      throw new Error("The backend returned an incomplete storage location response.");
    }
    page += 1;
  } while (items.length < total);

  return items;
}

export async function getStorageLocationMovements(id: string) {
  const response = await apiFetch<unknown>(
    `/storage-locations/${encodeURIComponent(id)}/movements`,
    { method: "GET", cache: "no-store" },
  );
  const result = storageMovementListSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid storage movement history response.");
  }

  return result.data;
}

async function parseStorageUnitResponse(response: unknown, operation: string) {
  const result = storageUnitSchema.safeParse(response);
  if (!result.success) {
    throw new Error(`The backend returned an invalid ${operation} storage location response.`);
  }
  return result.data;
}

export async function createStorageLocation(input: StorageLocationMutationInput) {
  const response = await apiFetch<unknown>("/storage-locations", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parseStorageUnitResponse(response, "created");
}

export async function updateStorageLocation(id: string, input: StorageLocationMutationInput) {
  const response = await apiFetch<unknown>(`/storage-locations/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      label: input.label,
      unitType: input.unitType,
      storageType: input.storageType,
      size: input.size,
      holdsSpecimens: input.holdsSpecimens,
      capacity: input.capacity,
    }),
  });
  return parseStorageUnitResponse(response, "updated");
}

export async function moveStorageLocation(id: string, input: StorageLocationMoveInput) {
  const response = await apiFetch<unknown>(`/storage-locations/${encodeURIComponent(id)}/move`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return parseStorageUnitResponse(response, "moved");
}

export async function archiveStorageLocation(id: string) {
  const response = await apiFetch<unknown>(`/storage-locations/${encodeURIComponent(id)}/archive`, {
    method: "PATCH",
  });
  return parseStorageUnitResponse(response, "archived");
}
