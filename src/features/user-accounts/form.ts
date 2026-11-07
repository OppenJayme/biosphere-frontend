/**
 * Form parsing for curator invitations (REQ-4.1-07) and status changes (REQ-4.1-08).
 * The backend stays authoritative for the role, duplicate emails, and audit logging;
 * these checks only reject input the backend would refuse anyway, before it is sent.
 */

import { z } from "zod";

export const FULL_NAME_MAX_LENGTH = 255;
export const REASON_MAX_LENGTH = 500;

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

export type CuratorStatusState = {
  reason: string;
  /** The reason field's own error. */
  error?: string;
  message?: string;
  success?: string;
};

export const EMPTY_CURATOR_STATUS_STATE: CuratorStatusState = { reason: "" };

const curatorStatusTargetSchema = z.object({
  accountId: z.uuid(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

const reasonSchema = z
  .string()
  .trim()
  .min(1, "Enter a reason.")
  .max(REASON_MAX_LENGTH, `Reason must be ${REASON_MAX_LENGTH} characters or fewer.`);

export type CuratorStatusInput = { status: "ACTIVE" | "INACTIVE"; reason: string };

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

/** The target comes from hidden fields, so a bad one is a stale or altered page, not a typing error. */
export function readCuratorStatusForm(formData: FormData) {
  return {
    reason: formString(formData, "reason"),
    name: formString(formData, "name"),
    target: curatorStatusTargetSchema.safeParse({
      accountId: formString(formData, "accountId"),
      status: formString(formData, "status"),
    }),
    parsedReason: reasonSchema.safeParse(formString(formData, "reason")),
  };
}

export type HandoverInput = { successorAccountId: string; reason: string };

export type HandoverState = {
  successorAccountId: string;
  reason: string;
  errors?: { successorAccountId?: string; reason?: string };
  message?: string;
  success?: string;
};

export const EMPTY_HANDOVER_STATE: HandoverState = { successorAccountId: "", reason: "" };

/** The successor is picked from a list, so a missing one means none was chosen. */
export function readHandoverForm(formData: FormData) {
  const successorAccountId = formString(formData, "successorAccountId");
  const reason = formString(formData, "reason");
  return {
    successorAccountId,
    reason,
    parsedSuccessor: z.uuid().safeParse(successorAccountId),
    parsedReason: reasonSchema.safeParse(reason),
  };
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
