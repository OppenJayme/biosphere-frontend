/** Public opt-in feedback only; ordinary chat never calls this submission endpoint. */
import { z } from "zod";
import { env } from "@/lib/env";

const policySchema = z.object({ enabled: z.boolean(), retentionDays: z.literal(30) });
const acceptedSchema = z.object({ accepted: z.literal(true) });
const privacy = { credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store" } as const;

export async function fetchReviewPolicy() {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/faq/assistant/review-policy`, privacy);
    if (!response.ok) return null;
    const parsed = policySchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch { return null; }
}

export async function submitReviewQuestion(question: string, submissionId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const unknown = "Submission could not be confirmed. Retry this same question to avoid double-counting; do not include personal details.";
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/faq/assistant/review-submissions`, {
      ...privacy, method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, submissionId, consent: true }),
    });
    if (!response.ok) {
      const message = response.status === 429 ? "Too many submissions from your network. Wait a minute, then retry this same question."
        : response.status === 400 ? "Check your question: use 1–500 characters and no personal details."
        : response.status === 409 ? "This retry token belongs to another question. Close this form and start again."
        : unknown;
      return { ok: false, message };
    }
    return acceptedSchema.safeParse(await response.json()).success ? { ok: true } : { ok: false, message: unknown };
  } catch { return { ok: false, message: unknown }; }
}
