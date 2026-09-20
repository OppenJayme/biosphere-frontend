import "server-only";
import { apiFetch } from "@/lib/api-client";
import {
  SPECIMEN_PAGE_LIMIT,
  specimenPageSchema,
  type SpecimenListQuery,
} from "./types";

export async function searchSpecimens(query: SpecimenListQuery) {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(SPECIMEN_PAGE_LIMIT),
    sortBy: "updatedAt",
    sortDirection: "desc",
  });

  if (query.search) params.set("search", query.search);
  if (query.status) params.set("status", query.status);

  const response = await apiFetch<unknown>(`/specimens/search?${params}`, {
    method: "GET",
    cache: "no-store",
  });
  const result = specimenPageSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid specimen catalog response.");
  }

  return result.data;
}
