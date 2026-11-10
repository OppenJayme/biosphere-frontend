/** Authenticated Server Actions for the curator Visit Request workflow (SRS 4.9). */

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  actionErrorMessage,
  refreshPublicWebsiteConsumers,
  requireCuratorSession,
  returnHref,
} from "../public-submissions/action-helpers";
import {
  emailOutcome,
  readDecisionEmail,
  readVisitorEmail,
  type CuratorActionState,
} from "../public-submissions/email-form";
import { stringValue } from "../public-submissions/form-fields";
import { NOTE_MAX, latestEmail } from "../public-submissions/history";
import type { ReturnQuery } from "../public-submissions/query";
import { MAX_PREFERRED_SCHEDULES } from "../public-submissions/schedule";
import {
  addVisitRequestNote,
  approveVisitSchedule,
  getVisitRequestHistory,
  sendVisitRequestMessage,
  updateVisitRequestStatus,
} from "./api";
import { emailsVisitorOnStatus } from "./workflow";

export type VisitActionState = CuratorActionState;

const optionalNote = z
  .string()
  .trim()
  .max(NOTE_MAX, `Keep the internal note to ${NOTE_MAX.toLocaleString()} characters or fewer.`)
  .transform((value) => value || undefined);

const STATUS_NOTICES = {
  SUBMITTED_FOR_CAMPUS_ENTRY: "visit-submitted",
  COMPLETED: "visit-completed",
  DECLINED: "visit-declined",
  CANCELLED: "visit-cancelled",
} as const;

/**
 * The backend saves the decision first and then records the email it sent (or failed to send) as
 * the newest timeline entry, so read it back to tell the curator whether the visitor was told.
 */
async function decisionEmailOutcome(id: string) {
  try {
    return emailOutcome(latestEmail(await getVisitRequestHistory(id)));
  } catch {
    return undefined;
  }
}

export async function updateVisitStatusAction(
  visitRequestId: string,
  returnQuery: ReturnQuery,
  _previousState: VisitActionState,
  formData: FormData,
): Promise<VisitActionState> {
  void _previousState;
  await requireCuratorSession();

  const note = stringValue(formData, "note");
  const email = readDecisionEmail(formData);
  const echo = { note, notifyVisitor: email.notifyVisitor, visitorMessage: email.rawMessage };
  const parsed = z
    .object({
      id: z.uuid(),
      status: z.enum(["SUBMITTED_FOR_CAMPUS_ENTRY", "COMPLETED", "DECLINED", "CANCELLED"], "Choose the new status."),
      note: optionalNote,
    })
    .safeParse({ id: visitRequestId, status: stringValue(formData, "status"), note });
  if (!parsed.success) return { ...echo, message: parsed.error.issues[0]?.message ?? "Choose a valid status." };

  const sendsEmail = emailsVisitorOnStatus(parsed.data.status);
  if (sendsEmail && email.error) return { ...echo, message: email.error };

  try {
    await updateVisitRequestStatus(parsed.data.id, {
      status: parsed.data.status,
      note: parsed.data.note,
      ...(sendsEmail ? { notifyVisitor: email.notifyVisitor, visitorMessage: email.visitorMessage } : {}),
    });
  } catch (error) {
    return { ...echo, message: actionErrorMessage(error, "visit-status") };
  }

  const outcome = sendsEmail && email.notifyVisitor ? await decisionEmailOutcome(parsed.data.id) : undefined;
  refreshPublicWebsiteConsumers();
  redirect(
    returnHref(returnQuery, { selected: parsed.data.id, notice: STATUS_NOTICES[parsed.data.status], email: outcome }),
  );
}

export async function approveVisitScheduleAction(
  visitRequestId: string,
  returnQuery: ReturnQuery,
  _previousState: VisitActionState,
  formData: FormData,
): Promise<VisitActionState> {
  void _previousState;
  await requireCuratorSession();

  const note = stringValue(formData, "note");
  const email = readDecisionEmail(formData);
  const echo = { note, notifyVisitor: email.notifyVisitor, visitorMessage: email.rawMessage };
  const parsed = z
    .object({
      id: z.uuid(),
      preferenceOrder: z.coerce
        .number("Choose the option to approve.")
        .int()
        .min(1, "Choose the option to approve.")
        .max(MAX_PREFERRED_SCHEDULES, "Choose the option to approve."),
      note: optionalNote,
    })
    .safeParse({ id: visitRequestId, preferenceOrder: stringValue(formData, "preferenceOrder") || undefined, note });
  if (!parsed.success) return { ...echo, message: parsed.error.issues[0]?.message ?? "Choose the option to approve." };
  if (email.error) return { ...echo, message: email.error };

  try {
    await approveVisitSchedule(parsed.data.id, {
      preferenceOrder: parsed.data.preferenceOrder,
      note: parsed.data.note,
      notifyVisitor: email.notifyVisitor,
      visitorMessage: email.visitorMessage,
    });
  } catch (error) {
    return { ...echo, message: actionErrorMessage(error, "approve-schedule") };
  }

  const outcome = email.notifyVisitor ? await decisionEmailOutcome(parsed.data.id) : undefined;
  refreshPublicWebsiteConsumers();
  redirect(returnHref(returnQuery, { selected: parsed.data.id, notice: "visit-approved", email: outcome }));
}

/** A curator-written email to the visitor, e.g. asking for more information. The status does not change. */
export async function sendVisitMessageAction(
  visitRequestId: string,
  returnQuery: ReturnQuery,
  _previousState: VisitActionState,
  formData: FormData,
): Promise<VisitActionState> {
  void _previousState;
  await requireCuratorSession();

  const email = readVisitorEmail(formData);
  const echo = { subject: email.values.subject, body: email.values.body };
  const safeId = z.uuid().safeParse(visitRequestId);
  if (!safeId.success) return { ...echo, message: "The visit request identifier is invalid. Reload and try again." };
  if (!email.success) return { ...echo, message: email.error };

  let outcome;
  try {
    outcome = emailOutcome(await sendVisitRequestMessage(safeId.data, email.data));
  } catch (error) {
    return { ...echo, message: actionErrorMessage(error, "visit-message") };
  }

  refreshPublicWebsiteConsumers();
  redirect(returnHref(returnQuery, { selected: safeId.data, notice: "email", email: outcome ?? "failed" }));
}

export async function addVisitNoteAction(
  visitRequestId: string,
  returnQuery: ReturnQuery,
  _previousState: VisitActionState,
  formData: FormData,
): Promise<VisitActionState> {
  void _previousState;
  await requireCuratorSession();

  const note = stringValue(formData, "note");
  const parsed = z
    .object({
      id: z.uuid(),
      note: z
        .string()
        .trim()
        .min(1, "Write the note before saving.")
        .max(NOTE_MAX, `Keep the note to ${NOTE_MAX.toLocaleString()} characters or fewer.`),
    })
    .safeParse({ id: visitRequestId, note });
  if (!parsed.success) return { note, message: parsed.error.issues[0]?.message ?? "Check the note and try again." };

  try {
    await addVisitRequestNote(parsed.data.id, parsed.data.note);
  } catch (error) {
    return { note, message: actionErrorMessage(error, "visit-note") };
  }

  refreshPublicWebsiteConsumers();
  redirect(returnHref(returnQuery, { selected: parsed.data.id, notice: "note-added" }));
}
