/** Curator timeline entries shared by inquiries and visit requests (communication_history). */

import { z } from "zod";

export const communicationEntrySchema = z.object({
  id: z.uuid(),
  direction: z.string(),
  type: z.string(),
  subject: z.string().nullable(),
  message: z.string(),
  recipientEmail: z.string().nullable(),
  deliveryResult: z.string().nullable(),
  sentAt: z.string().nullable(),
  recordedBy: z.string(),
  createdAt: z.string().min(1),
});

export const communicationHistorySchema = z.array(communicationEntrySchema);

export type CommunicationEntry = z.infer<typeof communicationEntrySchema>;

export const NOTE_MAX = 2000;
/** Visitor-facing email text (a message, or the note added to a decision email). */
export const VISITOR_MESSAGE_MAX = 5000;
export const EMAIL_SUBJECT_MAX = 150;

const ENTRY_TYPE_LABELS: Record<string, string> = {
  STATUS_CHANGE: "Status change",
  REFERRAL: "Referral",
  NOTE: "Internal note",
  STATUS_UPDATE_EMAIL: "Decision emailed to visitor",
  MESSAGE_EMAIL: "Email to visitor",
};

export function entryTypeLabel(type: string) {
  return ENTRY_TYPE_LABELS[type] ?? type.charAt(0) + type.slice(1).toLowerCase().replaceAll("_", " ");
}

/**
 * Timeline messages embed raw enum values ("Status changed from PENDING to REVIEWED.").
 * Swap the ones we know for their curator-facing labels; leave everything else untouched.
 */
export function readableHistoryMessage(message: string, labels: Record<string, string>) {
  return message.replace(/\b[A-Z][A-Z_]+[A-Z]\b/g, (token) => labels[token] ?? token);
}

export type DeliveryStatus = "sent" | "failed" | "not-sent";

/**
 * The backend stores the email provider's outcome as text: "SENT <id>", "FAILED <reason>", or
 * "NOT_SENT <reason>" (e.g. email not configured). A failed send never undoes the decision it
 * was about, so the UI must surface it rather than imply the visitor was told.
 */
export function deliveryStatus(result: string | null): DeliveryStatus | null {
  if (!result) return null;
  if (result.startsWith("SENT")) return "sent";
  if (result.startsWith("NOT_SENT")) return "not-sent";
  return "failed";
}

/** The reason after the status word, e.g. "401 Key not found". */
export function deliveryReason(result: string | null) {
  return (result ?? "").replace(/^(NOT_SENT|FAILED|SENT)\s*/, "").trim();
}

export function isOutboundEmail(entry: CommunicationEntry) {
  return entry.direction === "OUTBOUND";
}

/** The newest email on the timeline (entries come oldest first). */
export function latestEmail(entries: CommunicationEntry[]) {
  return entries.findLast(isOutboundEmail);
}
