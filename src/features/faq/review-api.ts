import "server-only";
import { z } from "zod";
import { apiFetch } from "@/lib/api-client";

const itemSchema = z.object({
  id: z.uuid(), question: z.string().min(1).max(500), repeatCount: z.number().int().positive(),
  status: z.enum(["PENDING", "REVIEWED", "DISMISSED"]), firstSubmittedAt: z.iso.datetime({ offset: true }),
  lastSubmittedAt: z.iso.datetime({ offset: true }), expiresAt: z.iso.datetime({ offset: true }),
});
export type ReviewItem = z.infer<typeof itemSchema>;
const queueSchema = z.object({ items: z.array(itemSchema).max(25), page: z.number().int().positive(), hasMore: z.boolean() });
export async function listReviewQuestions(page: number) {
  return queueSchema.parse(await apiFetch<unknown>(`/faq/review-queue?page=${page}`, { cache: "no-store" }));
}
