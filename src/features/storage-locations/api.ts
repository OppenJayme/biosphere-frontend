/** Server-only API client for the existing storage-location backend contract. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import {
  storageUnitPageSchema,
  type StorageLifecycle,
  type StorageUnit,
} from "./types";

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
