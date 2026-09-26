/** Server-only client for protected FAQ knowledge endpoints. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import { faqEntryPageSchema, type FaqEntryPage, type FaqListQuery } from "./types";

export async function listFaqEntries(query: FaqListQuery): Promise<FaqEntryPage> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.status) params.set("status", query.status);
  if (query.category) params.set("category", query.category);

  const response = await apiFetch<unknown>(`/faq/entries?${params}`, {
    method: "GET",
    cache: "no-store",
  });
  const result = faqEntryPageSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid FAQ knowledge response.");
  }

  return result.data;
}
