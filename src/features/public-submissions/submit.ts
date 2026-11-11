/**
 * Browser-side POST for the two public forms. The visitor's browser calls the backend directly
 * (no token needed) so the backend's per-IP public-form rate limit applies to each visitor; routing
 * through a Server Action would make every visitor share the Next.js server's IP and limit.
 */

import { z } from "zod";
import { env } from "@/lib/env";
import { readableServerMessage } from "./schedule";

const receiptSchema = z.object({
  id: z.uuid(),
  /** Short code the visitor quotes when following up; curators can search by it. */
  referenceCode: z.string().trim().min(1),
  status: z.literal("PENDING"),
  submittedAt: z.iso.datetime({ offset: true }),
});

export type SubmissionReceipt = z.infer<typeof receiptSchema>;

export type SubmissionResult =
  | { ok: true; receipt: SubmissionReceipt }
  | { ok: false; outcome: "rejected" | "unknown"; message: string; details: string[] };

/** Nest's ValidationPipe returns `message` as a string or a list of strings. */
function validationDetails(body: unknown): string[] {
  if (!body || typeof body !== "object" || !("message" in body)) return [];
  const { message } = body as { message: unknown };
  if (typeof message === "string") return [readableServerMessage(message)];
  if (Array.isArray(message)) {
    return message.filter((item): item is string => typeof item === "string").map(readableServerMessage);
  }
  return [];
}

/**
 * Only validation, overlap, and rate limit rejections are definitive; other failures may follow a
 * stored request.
 */
export function submissionFailure(status: number | null, body: unknown): SubmissionResult {
  if (status === 400) {
    return {
      ok: false,
      outcome: "rejected",
      message: "Some details were not accepted. Check the form and try again.",
      details: validationDetails(body),
    };
  }
  // 409: a preferred time overlaps a visit a curator already approved (backend spec 0001 AC-3).
  // Nothing was stored, so the visitor can pick another time and send again.
  if (status === 409) {
    return {
      ok: false,
      outcome: "rejected",
      message: "One of your preferred times is already booked. Choose another time, then submit again.",
      details: validationDetails(body),
    };
  }
  if (status === 429) {
    return {
      ok: false,
      outcome: "rejected",
      message: "Too many submissions from your network. Please wait a minute, then try again.",
      details: [],
    };
  }
  return {
    ok: false,
    outcome: "unknown",
    message: "We couldn't confirm your submission. The museum may have received it. Check any confirmation you received or contact the museum before sending again. Sending again may create another request.",
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
  if (!receipt.success) {
    return submissionFailure(null, null);
  }
  return { ok: true, receipt: receipt.data };
}
