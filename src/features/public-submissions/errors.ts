/**
 * Curator-facing messages for failed inquiry / visit-request actions. Free of server-only imports
 * so the mappings can be unit tested; server actions pass the ApiError (or null) in.
 */

export type ActionFailure = { status: number; body: unknown } | null;

export type CuratorOperation =
  | "inquiry-status"
  | "referral"
  | "inquiry-note"
  | "visit-status"
  | "approve-schedule"
  | "visit-note"
  | "inquiry-reply"
  | "visit-message";

const RECORD: Record<CuratorOperation, string> = {
  "inquiry-status": "inquiry",
  referral: "inquiry",
  "inquiry-note": "inquiry",
  "visit-status": "visit request",
  "approve-schedule": "visit request",
  "visit-note": "visit request",
  "inquiry-reply": "inquiry",
  "visit-message": "visit request",
};

const BAD_REQUEST: Record<CuratorOperation, string> = {
  "inquiry-status": "That status change isn't allowed from the inquiry's current status. Reload to see the latest state.",
  referral: "The visit details were not accepted. Check the schedules, visitor count, and contact number.",
  "inquiry-note": "Enter a note of up to 2,000 characters.",
  "visit-status": "That status change isn't allowed from the request's current status. Reload to see the latest state.",
  "approve-schedule":
    "That option can't be approved. Its date may have passed, or the request is no longer pending.",
  "visit-note": "Enter a note of up to 2,000 characters.",
  "inquiry-reply": "Write a message of up to 5,000 characters, with a subject of up to 150.",
  "visit-message": "Write a message of up to 5,000 characters, with a subject of up to 150.",
};

const FALLBACK: Record<CuratorOperation, string> = {
  "inquiry-status": "The inquiry status could not be changed.",
  referral: "The inquiry could not be turned into a visit request.",
  "inquiry-note": "The note could not be saved.",
  "visit-status": "The visit request status could not be changed.",
  "approve-schedule": "The schedule could not be approved.",
  "visit-note": "The note could not be saved.",
  // The email may already have gone out before the failure, so don't invite a blind resend.
  "inquiry-reply": "We couldn't confirm the reply was sent. Reload and check the history before sending it again.",
  "visit-message": "We couldn't confirm the message was sent. Reload and check the history before sending it again.",
};

const EMAIL_OPERATIONS: CuratorOperation[] = ["inquiry-reply", "visit-message"];

/** The backend's own 400 explanation, when it is a single readable sentence. */
function backendDetail(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("message" in body)) return undefined;
  const { message } = body as { message: unknown };
  if (typeof message === "string") return message;
  if (Array.isArray(message) && typeof message[0] === "string") return message[0];
  return undefined;
}

export function curatorActionError(failure: ActionFailure, operation: CuratorOperation) {
  const record = RECORD[operation];

  if (failure) {
    if (failure.status === 400) {
      const detail = backendDetail(failure.body);
      // Referral validation messages name the exact field (e.g. a past schedule date); show them.
      return operation === "referral" && detail ? `${BAD_REQUEST[operation]} (${detail})` : BAD_REQUEST[operation];
    }
    if (failure.status === 401) return "Your session expired. Sign in and try again.";
    if (failure.status === 403) return "Only curators can manage inquiries and visit requests.";
    if (failure.status === 404) return `This ${record} no longer exists. Reload the list.`;
    if (failure.status === 409) return `Another curator changed this ${record} at the same time. Reload and try again.`;
    if (failure.status === 429) return "Too many requests in a short time. Wait a minute and try again.";
  }

  if (EMAIL_OPERATIONS.includes(operation)) return FALLBACK[operation];
  return `${FALLBACK[operation]} Check your connection and try again.`;
}
