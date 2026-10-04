import "server-only";
import { apiFetch } from "@/lib/api-client";
import type { CreateSpecimenLotInput } from "./form";
import type {
  AdjustLotQuantityInput,
  ChangeLotConditionInput,
  MoveLotInput,
  UpdateLotNotesInput,
} from "./operations";
import {
  activeSpecimenLotSchema,
  specimenLotHistoryPageSchema,
  specimenLotListSchema,
  specimenLotOperationResultSchema,
  specimenLotQuantityAdjustmentResultSchema,
  specimenLotSchema,
  specimenLotSummarySchema,
  specimenLotTransactionPageSchema,
  storageUnitPageSchema,
  type LotTransactionType,
  type SpecimenLot,
  type StorageUnit,
} from "./types";

function lotsPath(specimenId: string, suffix = "") {
  return `/specimens/${encodeURIComponent(specimenId)}/lots${suffix}`;
}

function lotPath(specimenId: string, lotId: string, suffix = "") {
  return lotsPath(specimenId, `/${encodeURIComponent(lotId)}${suffix}`);
}

function parseResponse<T>(
  schema: { safeParse(value: unknown): { success: true; data: T } | { success: false } },
  response: unknown,
  description: string,
): T {
  const result = schema.safeParse(response);
  if (!result.success) {
    throw new Error(`The backend returned an invalid ${description} response.`);
  }
  return result.data;
}

export async function listActiveLots(specimenId: string): Promise<SpecimenLot[]> {
  const response = await apiFetch<unknown>(`/specimens/${specimenId}/lots`, {
    method: "GET",
    cache: "no-store",
  });
  const result = specimenLotListSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid specimen lot response.");
  }

  return result.data;
}

/** Active lots first, then lots that were emptied or fully moved. */
export async function listLotsIncludingInactive(specimenId: string) {
  const response = await apiFetch<unknown>(lotsPath(specimenId, "?includeInactive=true"), {
    method: "GET",
    cache: "no-store",
  });
  return parseResponse(specimenLotListSchema, response, "specimen lot");
}

export async function getSpecimenLot(specimenId: string, lotId: string) {
  const response = await apiFetch<unknown>(lotPath(specimenId, lotId), {
    method: "GET",
    cache: "no-store",
  });
  return parseResponse(specimenLotSchema, response, "specimen lot");
}

export async function getSpecimenLotSummary(specimenId: string) {
  const response = await apiFetch<unknown>(lotsPath(specimenId, "/summary"), {
    method: "GET",
    cache: "no-store",
  });
  return parseResponse(specimenLotSummarySchema, response, "specimen lot summary");
}

export type LotHistoryQuery = {
  page: number;
  limit: number;
  transactionType?: LotTransactionType;
};

export async function listSpecimenLotHistory(specimenId: string, query: LotHistoryQuery) {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.transactionType) params.set("transactionType", query.transactionType);

  const response = await apiFetch<unknown>(lotsPath(specimenId, `/history?${params}`), {
    method: "GET",
    cache: "no-store",
  });
  return parseResponse(specimenLotHistoryPageSchema, response, "specimen lot history");
}

export async function listLotTransactions(
  specimenId: string,
  lotId: string,
  query: { page: number; limit: number },
) {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  const response = await apiFetch<unknown>(lotPath(specimenId, lotId, `/transactions?${params}`), {
    method: "GET",
    cache: "no-store",
  });
  return parseResponse(specimenLotTransactionPageSchema, response, "lot transaction");
}

const STORAGE_PAGE_LIMIT = 100;

type StorageLifecycle = "ACTIVE" | "ALL";

async function getStorageUnitPage(lifecycle: StorageLifecycle, page: number) {
  const params = new URLSearchParams({
    lifecycle,
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

async function listStorageUnits(lifecycle: StorageLifecycle): Promise<StorageUnit[]> {
  const firstPage = await getStorageUnitPage(lifecycle, 1);
  const pageCount = Math.ceil(firstPage.total / firstPage.limit);
  if (pageCount <= 1) return firstPage.items;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      getStorageUnitPage(lifecycle, index + 2),
    ),
  );

  return [firstPage, ...remainingPages].flatMap((page) => page.items);
}

export function listActiveStorageUnits(): Promise<StorageUnit[]> {
  return listStorageUnits("ACTIVE");
}

/** Archived units included, so lot history can still name locations that were retired. */
export function listAllStorageUnits(): Promise<StorageUnit[]> {
  return listStorageUnits("ALL");
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

export async function moveSpecimenLot(specimenId: string, lotId: string, input: MoveLotInput) {
  const response = await apiFetch<unknown>(lotPath(specimenId, lotId, "/movements"), {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parseResponse(specimenLotOperationResultSchema, response, "lot movement");
}

export async function changeSpecimenLotCondition(
  specimenId: string,
  lotId: string,
  input: ChangeLotConditionInput,
) {
  const response = await apiFetch<unknown>(lotPath(specimenId, lotId, "/condition-changes"), {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parseResponse(specimenLotOperationResultSchema, response, "lot condition change");
}

export async function adjustSpecimenLotQuantity(
  specimenId: string,
  lotId: string,
  input: AdjustLotQuantityInput,
) {
  const response = await apiFetch<unknown>(lotPath(specimenId, lotId, "/quantity-adjustments"), {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parseResponse(
    specimenLotQuantityAdjustmentResultSchema,
    response,
    "lot quantity adjustment",
  );
}

export async function updateSpecimenLotNotes(
  specimenId: string,
  lotId: string,
  input: UpdateLotNotesInput,
) {
  const response = await apiFetch<unknown>(lotPath(specimenId, lotId, "/notes"), {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return parseResponse(specimenLotSchema, response, "lot notes");
}
