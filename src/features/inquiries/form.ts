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
import { INQUIRY_TYPES } from "./workflow";

const inquiryFormSchema = z
  .object({
    name: requiredText("your name", 100),
    email: emailField,
    phone: optionalPhone,
    organization: optionalText("the organization", 100),
    inquiryType: z.enum(INQUIRY_TYPES.map((type) => type.value), "Choose a topic from the list."),
    message: requiredText("your message", 2000),
    consent: consentField,
  })
  .transform(({ consent, ...fields }) => {
    void consent;
    return { ...fields, consentAccepted: true as const };
  });

export type InquirySubmission = z.output<typeof inquiryFormSchema>;
export type InquiryFormField = "name" | "email" | "phone" | "organization" | "inquiryType" | "message" | "consent";

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
    message: stringValue(formData, "message"),
    consent: formData.get("consent") ?? undefined,
  });

  if (result.success) return { success: true, data: result.data };
  return { success: false, errors: collectFieldErrors<InquiryFormField>(result.error) };
}
