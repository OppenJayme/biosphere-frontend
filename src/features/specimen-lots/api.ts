import "server-only";
import { apiFetch } from "@/lib/api-client";
import type { CreateSpecimenLotInput } from "./form";
import {
  activeSpecimenLotSchema,
  storageUnitPageSchema,
  type StorageUnit,
} from "./types";

const STORAGE_PAGE_LIMIT = 100;

async function getActiveStorageUnitPage(page: number) {
  const params = new URLSearchParams({
    lifecycle: "ACTIVE",
    page: String(page),
    limit: String(STORAGE_PAGE_LIMIT),
  });
  const response = await apiFetch<unknown>(`/storage-locations/search?${params}`, {
    method: "GET",
    cache: "no-store",
  });
  const result = storageUnitPageSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid storage-location response.");
  }

  return result.data;
}

export async function listActiveStorageUnits(): Promise<StorageUnit[]> {
  const firstPage = await getActiveStorageUnitPage(1);
  const pageCount = Math.ceil(firstPage.total / firstPage.limit);
  if (pageCount <= 1) return firstPage.items;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      getActiveStorageUnitPage(index + 2),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.items);
}

export async function createSpecimenLot(
  specimenId: string,
  input: CreateSpecimenLotInput,
) {
  const response = await apiFetch<unknown>(
    `/specimens/${encodeURIComponent(specimenId)}/lots`,
    { method: "POST", body: JSON.stringify(input) },
  );
  const result = activeSpecimenLotSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid created specimen-lot response.");
  }

  return result.data;
}
