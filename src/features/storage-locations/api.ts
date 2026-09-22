import "server-only";
import { apiFetch } from "@/lib/api-client";
import {
  storageOccupancySummaryListSchema,
  storageUnitListSchema,
  type StorageOccupancySummary,
  type StorageUnit,
} from "./types";

export async function listStorageLocations(): Promise<StorageUnit[]> {
  const response = await apiFetch<unknown>("/storage-locations", {
    method: "GET",
    cache: "no-store",
  });
  const result = storageUnitListSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid storage location response.");
  }

  return result.data;
}

export async function getStorageOccupancySummary(): Promise<StorageOccupancySummary[]> {
  const response = await apiFetch<unknown>("/storage-locations/occupancy-summary", {
    method: "GET",
    cache: "no-store",
  });
  const result = storageOccupancySummaryListSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid storage occupancy response.");
  }

  return result.data;
}
