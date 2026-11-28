/** Authenticated Server Actions for the curator General Inquiry workflow (SRS 4.8). */

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  actionErrorMessage,
  refreshPublicWebsiteConsumers,
  requireCuratorSession,
  returnHref,
} from "../public-submissions/action-helpers";
import type { ReturnQuery } from "../public-submissions/query";
import { stringValue } from "../public-submissions/form-fields";
import { NOTE_MAX } from "../public-submissions/history";
import { emailOutcome, readVisitorEmail, type CuratorActionState } from "../public-submissions/email-form";
import { addInquiryNote, getInquiry, referInquiry, sendInquiryReply, updateInquiryStatus } from "./api";
import { inquiryStatusSteps, type CuratorSettableInquiryStatus } from "./workflow";
import {
  readReferralForm,
  type ReferralFormField,
  type ReferralFormValues,
  type ReferralRequirements,
} from "./referral-form";
import type { FieldErrors } from "../public-submissions/form-fields";

export type NoteActionState = CuratorActionState;

export type ReferralActionState = {
  message?: string;
  values?: ReferralFormValues;
  errors?: FieldErrors<ReferralFormField>;
  scheduleErrors?: (string | undefined)[];
};

const optionalNote = z
  .string()
  .trim()
  .max(NOTE_MAX, `Keep the note to ${NOTE_MAX.toLocaleString()} characters or fewer.`)
  .transform((value) => value || undefined);

const requiredNote = z
  .string()
  .trim()
  .min(1, "Write the note before saving.")
  .max(NOTE_MAX, `Keep the note to ${NOTE_MAX.toLocaleString()} characters or fewer.`);

export async function updateInquiryStatusAction(
  inquiryId: string,
  returnQuery: ReturnQuery,
  _previousState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  void _previousState;
  await requireCuratorSession();

  const note = stringValue(formData, "note");
  const parsed = z
    .object({ id: z.uuid(), status: z.enum(["REVIEWED", "CLOSED"]), note: optionalNote })
    .safeParse({ id: inquiryId, status: stringValue(formData, "status"), note });
  if (!parsed.success) {
    return { note, message: parsed.error.issues[0]?.message ?? "Choose a valid status and try again." };
  }

  // The current status comes from the backend, not the page, so a stale tab cannot pick the steps.
  let steps: CuratorSettableInquiryStatus[] | null;
  try {
    const current = await getInquiry(parsed.data.id);
    steps = inquiryStatusSteps(current.status, parsed.data.status);
  } catch (error) {
    return { note, message: actionErrorMessage(error, "inquiry-status") };
  }
  if (!steps) {
    refreshPublicWebsiteConsumers();
    return { note, message: "This inquiry's status has changed since the page loaded. Reload it and try again." };
  }

  // The curator's note belongs to the status they chose, so it goes with the last step only.
  for (const [index, status] of steps.entries()) {
    const last = index === steps.length - 1;
    try {
      await updateInquiryStatus(parsed.data.id, last ? { status, note: parsed.data.note } : { status });
    } catch (error) {
      if (index === 0) return { note, message: actionErrorMessage(error, "inquiry-status") };
      // The review step went through, so the page must show Reviewed while the curator retries.
      refreshPublicWebsiteConsumers();
      return {
        note,
        message: `The inquiry was marked Reviewed, but closing it failed: ${actionErrorMessage(error, "inquiry-status")} Choose Closed to try again.`,
      };
    }
  }

  refreshPublicWebsiteConsumers();
  redirect(
    returnHref(returnQuery, {
      selected: parsed.data.id,
      notice: parsed.data.status === "REVIEWED" ? "inquiry-reviewed" : "inquiry-closed",
    }),
  );
}

export async function addInquiryNoteAction(
  inquiryId: string,
  returnQuery: ReturnQuery,
  _previousState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  void _previousState;
  await requireCuratorSession();

  const note = stringValue(formData, "note");
  const parsed = z.object({ id: z.uuid(), note: requiredNote }).safeParse({ id: inquiryId, note });
  if (!parsed.success) return { note, message: parsed.error.issues[0]?.message ?? "Check the note and try again." };

  try {
    await addInquiryNote(parsed.data.id, parsed.data.note);
  } catch (error) {
    return { note, message: actionErrorMessage(error, "inquiry-note") };
  }

  refreshPublicWebsiteConsumers();
  redirect(returnHref(returnQuery, { selected: parsed.data.id, notice: "note-added" }));
}

/** Emails the visitor a curator-written reply (REQ-4.8-09). The status does not change. */
export async function sendInquiryReplyAction(
  inquiryId: string,
  returnQuery: ReturnQuery,
  _previousState: NoteActionState,
  formData: FormData,
): Promise<NoteActionState> {
  void _previousState;
  await requireCuratorSession();

  const email = readVisitorEmail(formData);
  const echo = { subject: email.values.subject, body: email.values.body };
  const safeId = z.uuid().safeParse(inquiryId);
  if (!safeId.success) return { ...echo, message: "The inquiry identifier is invalid. Reload and try again." };
  if (!email.success) return { ...echo, message: email.error };

  let outcome;
  try {
    outcome = emailOutcome(await sendInquiryReply(safeId.data, email.data));
  } catch (error) {
    return { ...echo, message: actionErrorMessage(error, "inquiry-reply") };
  }

  refreshPublicWebsiteConsumers();
  redirect(returnHref(returnQuery, { selected: safeId.data, notice: "email", email: outcome ?? "failed" }));
}

export async function referInquiryAction(
  inquiryId: string,
  requirements: ReferralRequirements,
  returnQuery: ReturnQuery,
  _previousState: ReferralActionState,
  formData: FormData,
): Promise<ReferralActionState> {
  void _previousState;
  await requireCuratorSession();

  const parsed = readReferralForm(formData, {
    phone: requirements?.phone === true,
    organization: requirements?.organization === true,
  });
  if (!parsed.success) {
    return {
      values: parsed.values,
      errors: parsed.errors,
      scheduleErrors: parsed.scheduleErrors,
      message: "Fix the highlighted fields, then try again.",
    };
  }

  const safeId = z.uuid().safeParse(inquiryId);
  if (!safeId.success) return { values: parsed.values, message: "The inquiry identifier is invalid. Reload and try again." };

  let visitRequestId: string;
  try {
    ({ visitRequestId } = await referInquiry(safeId.data, parsed.data));
  } catch (error) {
    return { values: parsed.values, message: actionErrorMessage(error, "referral") };
  }

  refreshPublicWebsiteConsumers();
  redirect(returnHref(returnQuery, { tab: "visits", selected: visitRequestId, notice: "referred" }));
}
