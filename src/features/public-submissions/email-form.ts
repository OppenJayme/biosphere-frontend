/** Form parsing for curator emails to visitors: decision emails and curator-written messages. */

import { z } from "zod";
import { stringValue } from "./form-fields";
import {
  EMAIL_SUBJECT_MAX,
  VISITOR_MESSAGE_MAX,
  deliveryStatus,
  type CommunicationEntry,
  type DeliveryStatus,
} from "./history";

/**
 * View state shared by the curator actions. Everything a curator typed is echoed back on failure,
 * because React resets a form after its action runs.
 */
export type CuratorActionState = {
  /** Error to show; unset on success (success redirects). */
  message?: string;
  note?: string;
  notifyVisitor?: boolean;
  visitorMessage?: string;
  subject?: string;
  body?: string;
};

const visitorMessageField = z
  .string()
  .trim()
  .max(VISITOR_MESSAGE_MAX, `Keep the message to the visitor to ${VISITOR_MESSAGE_MAX.toLocaleString()} characters or fewer.`)
  .transform((value) => value || undefined);

/**
 * The "Notify visitor by email" checkbox and optional visitor-facing message sent with an approval,
 * decline, or cancellation. An unchecked box is absent from FormData, so it reads as "don't email".
 */
export function readDecisionEmail(formData: FormData) {
  const notifyVisitor = formData.get("notifyVisitor") === "on";
  const rawMessage = stringValue(formData, "visitorMessage");
  const parsed = visitorMessageField.safeParse(rawMessage);
  return {
    notifyVisitor,
    rawMessage,
    error: parsed.success ? undefined : parsed.error.issues[0]?.message,
    // The message only travels with an email; don't send it when the curator unticked the box.
    visitorMessage: parsed.success && notifyVisitor ? parsed.data : undefined,
  };
}

const visitorEmailSchema = z.object({
  subject: z
    .string()
    .trim()
    .max(EMAIL_SUBJECT_MAX, `Keep the subject to ${EMAIL_SUBJECT_MAX} characters or fewer.`)
    .transform((value) => value || undefined),
  message: z
    .string()
    .trim()
    .min(1, "Write the message to the visitor.")
    .max(VISITOR_MESSAGE_MAX, `Keep the message to ${VISITOR_MESSAGE_MAX.toLocaleString()} characters or fewer.`),
});

/** A curator-written email: an inquiry reply or a visit-request message. */
export function readVisitorEmail(formData: FormData) {
  const values = { subject: stringValue(formData, "subject"), body: stringValue(formData, "body") };
  const parsed = visitorEmailSchema.safeParse({ subject: values.subject, message: values.body });
  return parsed.success
    ? { success: true as const, values, data: parsed.data }
    : { success: false as const, values, error: parsed.error.issues[0]?.message ?? "Check the email and try again." };
}

/** URL flag describing what happened to the email a curator action just triggered. */
export function emailOutcome(entry: CommunicationEntry | undefined): DeliveryStatus | undefined {
  return entry ? (deliveryStatus(entry.deliveryResult) ?? undefined) : undefined;
}
