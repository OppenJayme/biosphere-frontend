import "server-only";
import { apiFetch } from "@/lib/api-client";
import { inquiryListSchema, type Inquiry } from "./types";

export async function listInquiries(): Promise<Inquiry[]> {
  const response = await apiFetch<unknown>("/inquiries", {
    method: "GET",
    cache: "no-store",
  });
  const result = inquiryListSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid inquiry list response.");
  }

  return result.data;
}
