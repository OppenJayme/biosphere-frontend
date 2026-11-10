/** Parses the public General Inquiry form into the POST /inquiries body (SRS REQ-4.8-02/03/04). */

import { z } from "zod";
import {
  collectFieldErrors,
  consentField,
  emailField,
  optionalPhone,
  optionalText,
  requiredText,
  stringValue,
  type FieldErrors,
} from "../public-submissions/form-fields";
import { INQUIRY_TYPES, VISIT_FOLLOW_UP_TYPE } from "./workflow";

// The 8-character reference number on a visit request receipt, e.g. 9A81836F.
const visitReferenceField = z
  .string()
  .trim()
  .toUpperCase()
  .refine((value) => value === "" || /^[0-9A-F]{8}$/.test(value), {
    message: "Enter the 8-character reference number from your visit request email, e.g. 9A81836F.",
  })
  .transform((value) => value || undefined);

const inquiryFormSchema = z
  .object({
    name: requiredText("your name", 100),
    email: emailField,
    phone: optionalPhone,
    organization: optionalText("the organization", 100),
    inquiryType: z.enum(INQUIRY_TYPES.map((type) => type.value), "Choose a topic from the list."),
    visitReferenceCode: visitReferenceField,
    message: requiredText("your message", 2000),
    consent: consentField,
  })
  .transform(({ consent, visitReferenceCode, ...fields }) => {
    void consent;
    // Only a visit follow-up carries a reference number.
    return {
      ...fields,
      ...(fields.inquiryType === VISIT_FOLLOW_UP_TYPE && { visitReferenceCode }),
      consentAccepted: true as const,
    };
  });

export type InquirySubmission = z.output<typeof inquiryFormSchema>;
export type InquiryFormField =
  | "name"
  | "email"
  | "phone"
  | "organization"
  | "inquiryType"
  | "visitReferenceCode"
  | "message"
  | "consent";

export type InquiryFormResult =
  | { success: true; data: InquirySubmission }
  | { success: false; errors: FieldErrors<InquiryFormField> };

export function readInquiryForm(formData: FormData): InquiryFormResult {
  const result = inquiryFormSchema.safeParse({
    name: stringValue(formData, "name"),
    email: stringValue(formData, "email"),
    phone: stringValue(formData, "phone"),
    organization: stringValue(formData, "organization"),
    inquiryType: stringValue(formData, "inquiryType") || "GENERAL",
    visitReferenceCode: stringValue(formData, "visitReferenceCode"),
    message: stringValue(formData, "message"),
    consent: formData.get("consent") ?? undefined,
  });

  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: collectFieldErrors<InquiryFormField>(result.error) };
}
