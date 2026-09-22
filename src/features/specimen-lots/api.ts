import "server-only";
import { apiFetch } from "@/lib/api-client";
import { specimenLotListSchema, type SpecimenLot } from "./types";

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
