/** Parses the curator "Turn into visit request" form into the POST /inquiries/:id/referral body (REQ-4.8-07). */

import { z } from "zod";
import {
  collectFieldErrors,
  optionalPhone,
  optionalText,
  stringValue,
  stringValues,
  type FieldErrors,
} from "../public-submissions/form-fields";
import { NOTE_MAX } from "../public-submissions/history";
import { validateSchedules } from "../public-submissions/schedule";
import { readScheduleRows, visitorCountField } from "../visit-requests/form";
import type { InquiryReferralInput } from "./types";

export type ReferralFormField = "phone" | "organization" | "purpose" | "visitorCount" | "note" | "schedules";

/** Raw inputs echoed back after a failed submit, so React's form reset doesn't wipe them. */
export type ReferralFormValues = {
  phone: string;
  organization: string;
  purpose: string;
  visitorCount: string;
  note: string;
  scheduleDate: string[];
  scheduleStart: string[];
  scheduleEnd: string[];
};

/** Which contact details the inquiry lacks; the backend requires them only then. */
export type ReferralRequirements = { phone: boolean; organization: boolean };

export type ReferralFormResult =
  | { success: true; data: InquiryReferralInput; values: ReferralFormValues }
  | {
      success: false;
      values: ReferralFormValues;
      errors: FieldErrors<ReferralFormField>;
      scheduleErrors: (string | undefined)[];
    };

const referralSchema = z.object({
  phone: optionalPhone,
  organization: optionalText("the organization", 255),
  purpose: optionalText("the purpose", 1000),
  visitorCount: visitorCountField,
  note: optionalText("the note", NOTE_MAX),
});

export function readReferralForm(
  formData: FormData,
  requirements: ReferralRequirements,
  today?: string,
): ReferralFormResult {
  const values: ReferralFormValues = {
    phone: stringValue(formData, "phone"),
    organization: stringValue(formData, "organization"),
    purpose: stringValue(formData, "purpose"),
    visitorCount: stringValue(formData, "visitorCount"),
    note: stringValue(formData, "note"),
    scheduleDate: stringValues(formData, "scheduleDate"),
    scheduleStart: stringValues(formData, "scheduleStart"),
    scheduleEnd: stringValues(formData, "scheduleEnd"),
  };

  const fields = referralSchema.safeParse({ ...values, visitorCount: values.visitorCount.trim() });
  const schedules = readScheduleRows(formData);
  const scheduleCheck = validateSchedules(schedules, today);

  const errors: FieldErrors<ReferralFormField> = {};
  if (!fields.success) Object.assign(errors, collectFieldErrors<ReferralFormField>(fields.error));
  if (requirements.phone && !values.phone.trim()) {
    errors.phone ??= "The inquiry has no contact number, so enter one for the visit request.";
  }
  if (requirements.organization && !values.organization.trim()) {
    errors.organization ??= "The inquiry has no organization, so enter one for the visit request.";
  }
  if (scheduleCheck.listError) errors.schedules = scheduleCheck.listError;

  if (!fields.success || Object.keys(errors).length > 0 || !scheduleCheck.valid) {
    return { success: false, values, errors, scheduleErrors: scheduleCheck.rowErrors };
  }

  return { success: true, values, data: { ...fields.data, preferredSchedules: schedules } };
}
