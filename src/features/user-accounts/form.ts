/**
 * Form parsing for a curator inviting another curator (REQ-4.1-07).
 * The backend stays authoritative for the role, duplicate emails, and audit logging;
 * these checks only reject input the backend would refuse anyway, before it is sent.
 */

import { z } from "zod";

export const FULL_NAME_MAX_LENGTH = 255;

export type InviteCuratorValues = { email: string; fullName: string };
export type InviteCuratorField = keyof InviteCuratorValues;
export type InviteCuratorState = {
  values: InviteCuratorValues;
  errors?: Partial<Record<InviteCuratorField, string>>;
  message?: string;
  success?: string;
};

export const EMPTY_INVITE_VALUES: InviteCuratorValues = { email: "", fullName: "" };

const inviteCuratorSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Enter the curator's full name.")
    .max(FULL_NAME_MAX_LENGTH, `Full name must be ${FULL_NAME_MAX_LENGTH} characters or fewer.`),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Enter a valid email address.").max(255, "Email must be 255 characters or fewer.")),
});

export type InviteCuratorInput = z.output<typeof inviteCuratorSchema>;

function formString(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export function readInviteCuratorForm(formData: FormData) {
  const values: InviteCuratorValues = {
    email: formString(formData, "email"),
    fullName: formString(formData, "fullName"),
  };
  return { values, result: inviteCuratorSchema.safeParse(values) };
}

/** The first message for each field, so every invalid input can show its own error. */
export function fieldErrors(error: z.ZodError): Partial<Record<InviteCuratorField, string>> {
  const errors: Partial<Record<InviteCuratorField, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if ((field === "email" || field === "fullName") && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
