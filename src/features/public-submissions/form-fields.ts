/** Field helpers shared by the public inquiry and visit-request forms. */

import { z } from "zod";

export const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;
export const PHONE_MESSAGE = "Use 7 to 20 digits, spaces, or + ( ) - characters.";

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

export function stringValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export function stringValues(formData: FormData, field: string) {
  return formData.getAll(field).map((value) => (typeof value === "string" ? value : ""));
}

export const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}.`)
    .max(max, `Keep ${label} to ${max} characters or fewer.`);

/**
 * Optional text that is dropped when blank. The backend trims and then rejects empty strings on
 * optional fields, so a blank input must be omitted rather than sent as "".
 */
export const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep ${label} to ${max} characters or fewer.`)
    .transform((value) => value || undefined);

export const emailField = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(100, "Keep the email address to 100 characters or fewer.")
  .pipe(z.email("Enter a valid email address."));

export const requiredPhone = z
  .string()
  .trim()
  .min(1, "Enter a contact number.")
  .regex(PHONE_PATTERN, PHONE_MESSAGE);

export const optionalPhone = z
  .string()
  .trim()
  .refine((value) => !value || PHONE_PATTERN.test(value), PHONE_MESSAGE)
  .transform((value) => value || undefined);

export const consentField = z.literal("on", {
  error: "Please accept the privacy notice so the museum can use your details to respond.",
});

/** First issue per top-level field, keyed by field name. */
export function collectFieldErrors<Field extends string>(error: z.ZodError): FieldErrors<Field> {
  const errors: FieldErrors<Field> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "") as Field;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}
