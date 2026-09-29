/**
 * Browser-side POST for the two public forms. The visitor's browser calls the backend directly
 * (no token needed) so the backend's per-IP public-form rate limit applies to each visitor; routing
 * through a Server Action would make every visitor share the Next.js server's IP and limit.
 */

import { z } from "zod";
import { env } from "@/lib/env";

const receiptSchema = z.object({
  id: z.uuid(),
  /** Short code the visitor quotes when following up; curators can search by it. */
  referenceCode: z.string().min(1),
  status: z.string(),
  submittedAt: z.string(),
});

export type SubmissionReceipt = z.infer<typeof receiptSchema>;

export type SubmissionResult =
  | { ok: true; receipt: SubmissionReceipt }
  | { ok: false; message: string; details: string[] };

/** Nest's ValidationPipe returns `message` as a string or a list of strings. */
function validationDetails(body: unknown): string[] {
  if (!body || typeof body !== "object" || !("message" in body)) return [];
  const { message } = body as { message: unknown };
  if (typeof message === "string") return [message];
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === "string");
  return [];
}

export function submissionFailure(status: number | null, body: unknown): SubmissionResult {
  if (status === 400) {
    return {
      ok: false,
      message: "Some details were not accepted. Check the form and try again.",
      details: validationDetails(body),
    };
  }
  if (status === 429) {
    return {
      ok: false,
      message: "Too many submissions from your network. Please wait a minute, then try again.",
      details: [],
    };
  }
  return {
    ok: false,
    message:
      status === null
        ? "We couldn't reach the museum's system. Check your internet connection and try again."
        : "Your request was not sent because of a problem on our side. Please try again later.",
    details: [],
  };
}

export async function postPublicSubmission(
  path: "/inquiries" | "/visit-requests",
  payload: unknown,
): Promise<SubmissionResult> {
  let response: Response;
  try {
    response = await fetch(`${env.NEXT_PUBLIC_API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return submissionFailure(null, null);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) return submissionFailure(response.status, body);

  const receipt = receiptSchema.safeParse(body);
  // The request was stored; only the receipt is unreadable. Never report that as a failure.
  if (!receipt.success) {
    return { ok: true, receipt: { id: "", referenceCode: "", status: "PENDING", submittedAt: new Date().toISOString() } };
  }
  return { ok: true, receipt: receipt.data };
}
