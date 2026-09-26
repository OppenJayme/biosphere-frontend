/** Server-only client for protected FAQ knowledge endpoints. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import type { FaqMutationInput } from "./management";
import {
  faqEntryPageSchema,
  faqEntrySchema,
  type FaqEntryPage,
  type FaqListQuery,
} from "./types";

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

async function parseFaqEntry(response: unknown, operation: string) {
  const result = faqEntrySchema.safeParse(response);
  if (!result.success) {
    throw new Error(`The backend returned an invalid ${operation} FAQ response.`);
  }
  return result.data;
}

export async function createFaqEntry(input: FaqMutationInput) {
  const response = await apiFetch<unknown>("/faq/entries", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return parseFaqEntry(response, "created");
}

export async function updateFaqEntry(id: string, input: FaqMutationInput) {
  const response = await apiFetch<unknown>(`/faq/entries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return parseFaqEntry(response, "updated");
}

export async function changeFaqStatus(
  id: string,
  command: "activate" | "deactivate" | "archive",
) {
  const response = await apiFetch<unknown>(
    `/faq/entries/${encodeURIComponent(id)}/${command}`,
    { method: "PATCH" },
  );
  return parseFaqEntry(response, command);
}
