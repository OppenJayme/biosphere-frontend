import "server-only";
import { apiFetch } from "@/lib/api-client";
import { visitRequestListSchema, type VisitRequest } from "./types";

export async function listVisitRequests(): Promise<VisitRequest[]> {
  const response = await apiFetch<unknown>("/visit-requests", {
    method: "GET",
    cache: "no-store",
  });
  const result = visitRequestListSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid visit request list response.");
  }

  return result.data;
}
