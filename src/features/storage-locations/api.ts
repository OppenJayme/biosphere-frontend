/** Server-only API client for the existing storage-location backend contract. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import { specimenLotHistoryPageSchema, type SpecimenLotHistoryPage } from "../specimen-lots/types";
import {
  storageInventoryPageSchema,
  storageMovementListSchema,
  storageOccupancyListSchema,
  storageUnitSchema,
  storageUnitPageSchema,
  type StorageInventoryPage,
  type StorageLifecycle,
  type StorageOccupancy,
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

export async function getStorageOccupancySummary(): Promise<StorageOccupancy[]> {
  const response = await apiFetch<unknown>("/storage-locations/occupancy-summary", { method: "GET", cache: "no-store" });
  const result = storageOccupancyListSchema.safeParse(response);
  if (!result.success) throw new Error("The backend returned an invalid storage occupancy response.");
  return result.data;
}

/** At most this many lots are loaded for one unit (20 backend pages); a note says when more exist. */
export const STORAGE_INVENTORY_MAX_LOTS = 2000;

/**
 * Every active lot placed directly in a unit, read 100 at a time, so the Locations tab can count
 * categories and records for the whole unit and page through the table in the browser.
 */
export async function getStorageInventory(id: string): Promise<StorageInventoryPage> {
  const items: StorageInventoryPage["items"] = [];
  let first: StorageInventoryPage | null = null;
  for (let page = 1; items.length < STORAGE_INVENTORY_MAX_LOTS; page += 1) {
    const query = new URLSearchParams({ page: String(page), limit: "100" });
    const response = await apiFetch<unknown>(`/storage-locations/${encodeURIComponent(id)}/inventory?${query}`, {
      method: "GET",
      cache: "no-store",
    });
    const result = storageInventoryPageSchema.safeParse(response);
    if (!result.success || result.data.page !== page) {
      throw new Error("The backend returned an invalid storage inventory response.");
    }
    first ??= result.data;
    items.push(...result.data.items);
    if (result.data.items.length === 0 || items.length >= result.data.totalLots) break;
  }
  return { ...first!, items, page: 1, limit: items.length || 1 };
}

/** The most recent specimen-lot movements and changes involving a unit, newest first. */
export async function getStorageLotMovements(id: string, limit = 100): Promise<SpecimenLotHistoryPage> {
  const query = new URLSearchParams({ page: "1", limit: String(limit) });
  const response = await apiFetch<unknown>(`/storage-locations/${encodeURIComponent(id)}/lot-movements?${query}`, {
    method: "GET",
    cache: "no-store",
  });
  const result = specimenLotHistoryPageSchema.safeParse(response);
  if (!result.success) throw new Error("The backend returned an invalid lot movement response.");
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
