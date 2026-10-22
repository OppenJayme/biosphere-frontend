/** Server-only client for public assistant questions that had no approved answer. */

import "server-only";
import { z } from "zod";
import { apiFetch } from "@/lib/api-client";

export const unansweredQuestionSchema = z.object({
  id: z.uuid(),
  question: z.string(),
  outcome: z.string(),
  timesAsked: z.number().int().positive(),
  firstAskedAt: z.string(),
  lastAskedAt: z.string(),
  reviewedAt: z.string().nullable(),
  reviewedByName: z.string().nullable(),
  faqEntryId: z.uuid().nullable(),
});

export const unansweredQuestionPageSchema = z.object({
  items: z.array(unansweredQuestionSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  retentionDays: z.number().int().positive(),
});

export type UnansweredQuestion = z.infer<typeof unansweredQuestionSchema>;
export type UnansweredQuestionPage = z.infer<typeof unansweredQuestionPageSchema>;
export type UnansweredReviewFilter = "OPEN" | "REVIEWED" | "ALL";

export async function listUnansweredQuestions(
  review: UnansweredReviewFilter = "OPEN",
  limit = 25,
): Promise<UnansweredQuestionPage> {
  const params = new URLSearchParams({ review, page: "1", limit: String(limit) });
  const response = await apiFetch<unknown>(`/faq/unanswered?${params}`, {
    method: "GET",
    cache: "no-store",
  });
  const result = unansweredQuestionPageSchema.safeParse(response);
  if (!result.success) {
    throw new Error("The backend returned an invalid unanswered-question response.");
  }
  return result.data;
}

export async function reviewUnansweredQuestion(id: string) {
  await apiFetch<unknown>(`/faq/unanswered/${encodeURIComponent(id)}/review`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}
