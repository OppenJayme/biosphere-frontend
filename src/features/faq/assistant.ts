/**
 * Browser-side client for the public FAQ Assistant. Like the public forms, the visitor's browser
 * calls the backend directly so the backend's per-IP FAQ rate limit applies to each visitor rather
 * than to the shared Next.js server. It sends the question, an optional public FAQ choice or topic
 * ID, and up to four earlier questions from the open chat so follow-ups can be understood. Nothing is
 * stored, and earlier questions never add facts: answers still come only from approved FAQs.
 */

import { z } from "zod";
import { env } from "@/lib/env";

export const FAQ_QUESTION_MAX_LENGTH = 500;
export const FAQ_SUGGESTION_LIMIT = 6;
/** Earlier visitor questions sent with each message (backend maximum). */
export const FAQ_HISTORY_LIMIT = 4;

/** Shown before the backend responds, and if it cannot be reached (REQ-4.11-10). */
export const FAQ_DEFAULT_NOTICE =
  "Answers are limited to curator-approved museum information. The assistant cannot approve visits or process campus entry.";

const publicQuestionSchema = z.object({
  id: z.uuid(),
  question: z.string().min(1),
  category: z.string().nullable(),
});

const suggestionListSchema = z.object({
  items: z.array(publicQuestionSchema),
  notice: z.string().min(1),
});

const assistantResponseSchema = z.object({
  outcome: z.enum(["ANSWERED", "CLARIFICATION_NEEDED", "NO_MATCH", "VISIT_REQUEST_REDIRECT", "SMALL_TALK"]),
  answer: publicQuestionSchema.extend({ answer: z.string().min(1) }).nullable(),
  related: z.array(publicQuestionSchema),
  message: z.string().nullable(),
  redirect: z.enum(["GENERAL_INQUIRY", "VISIT_REQUEST"]).nullable(),
  // True when the wording was produced by the optional AI layer from the listed approved sources.
  assisted: z.boolean().default(false),
  sources: z.array(publicQuestionSchema).default([]),
  notice: z.string().min(1),
}).refine((data) => !data.assisted || data.outcome !== "ANSWERED" || data.sources.length > 0,
  "An AI-assisted answer must name its approved sources.",
).refine((data) => data.outcome !== "SMALL_TALK" || (data.answer === null && Boolean(data.message)),
  "Small talk carries a message, never an answer.",
).refine((data) => data.outcome !== "CLARIFICATION_NEEDED" || (
  data.answer === null &&
  data.related.length >= 2 && data.related.length <= 3 &&
  new Set(data.related.map((item) => item.id)).size === data.related.length
), "Clarification must offer two or three distinct questions without an answer.");

export type PublicFaqQuestion = z.infer<typeof publicQuestionSchema>;
export type FaqSuggestionList = z.infer<typeof suggestionListSchema>;
export type FaqAssistantResponse = z.infer<typeof assistantResponseSchema>;
export type FaqAssistantRedirect = NonNullable<FaqAssistantResponse["redirect"]>;

export type FaqAssistantResult<T> = { ok: true; data: T } | { ok: false; message: string };

export const FAQ_REDIRECTS: Record<FaqAssistantRedirect, { href: string; label: string }> = {
  GENERAL_INQUIRY: { href: "/inquiry", label: "Send a General Inquiry" },
  VISIT_REQUEST: { href: "/visit", label: "Go to the Visit Request form" },
};

export function faqAssistantFailure(status: number | null): string {
  if (status === null) {
    return "The assistant needs an internet connection. Check your connection and try again.";
  }
  if (status === 400) {
    return `Please enter a question of up to ${FAQ_QUESTION_MAX_LENGTH} characters.`;
  }
  if (status === 429) {
    return "Too many questions from your network. Please wait a minute, then try again.";
  }
  return "The assistant is unavailable right now. Please try again later or send a General Inquiry.";
}

async function requestAssistant<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<FaqAssistantResult<T>> {
  let response: Response;
  try {
    response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, { ...init, cache: "no-store" });
  } catch {
    return { ok: false, message: faqAssistantFailure(null) };
  }
  if (!response.ok) return { ok: false, message: faqAssistantFailure(response.status) };

  const parsed = schema.safeParse(await response.json().catch(() => null));
  // Never show unvalidated text: an unexpected shape could be something other than approved knowledge.
  if (!parsed.success) return { ok: false, message: faqAssistantFailure(500) };
  return { ok: true, data: parsed.data };
}

export function fetchFaqSuggestions(): Promise<FaqAssistantResult<FaqSuggestionList>> {
  return requestAssistant(
    `/faq/assistant/suggestions?limit=${FAQ_SUGGESTION_LIMIT}`,
    suggestionListSchema,
  );
}

export function askFaqAssistant(
  question: string,
  selectedFaqId?: string,
  contextFaqId?: string,
  history: string[] = [],
): Promise<FaqAssistantResult<FaqAssistantResponse>> {
  const recent = history.slice(-FAQ_HISTORY_LIMIT);
  return requestAssistant("/faq/assistant/ask", assistantResponseSchema, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      ...(selectedFaqId ? { selectedFaqId } : {}),
      ...(contextFaqId ? { contextFaqId } : {}),
      ...(recent.length ? { history: recent } : {}),
    }),
  });
}

/**
 * Mirrors the backend's explicit follow-up openers (backend `parseFaqFollowup`): "How/What about …"
 * and "And on/for/at/in/with/if …". Only these send the single topic hint; keep both in sync.
 */
export function isFaqFollowup(question: string): boolean {
  const normalized = question
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return /^(?:(?:how|what) about|and(?= (?:on|for|at|in|with|if) ))(?: |$)/.test(normalized);
}

/** Trims and bounds a visitor question before it is sent; returns null when there is nothing to ask. */
export function normalizeVisitorQuestion(value: string): string | null {
  const question = value.trim().replace(/\s+/g, " ");
  if (!question || question.length > FAQ_QUESTION_MAX_LENGTH) return null;
  return question;
}
