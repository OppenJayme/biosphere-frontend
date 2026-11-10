/** Form parsing and error wording for changing your own password (REQ-4.1-16). */

import { newPasswordSchema } from "./schema";

export type ChangePasswordState = { message?: string };

type ParsedForm =
  | { success: true; data: { currentPassword: string; newPassword: string } }
  | { success: false; message: string };

export function readChangePasswordForm(formData: FormData): ParsedForm {
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof currentPassword !== "string" || !currentPassword) {
    return { success: false, message: "Enter your current password." };
  }
  const parsed = newPasswordSchema.safeParse(newPassword);
  if (!parsed.success) return { success: false, message: parsed.error.issues[0].message };
  if (newPassword !== confirmPassword) return { success: false, message: "Passwords do not match." };
  if (newPassword === currentPassword) {
    return { success: false, message: "Choose a new password that differs from your current one." };
  }
  return { success: true, data: { currentPassword, newPassword: parsed.data } };
}

/** The message for a failed change; a null error means the backend could not be reached. */
export function changePasswordErrorMessage(error: { status: number; body: unknown } | null) {
  if (error?.status === 400) {
    const body = error.body;
    const message = typeof body === "object" && body !== null && "message" in body ? body.message : null;
    return typeof message === "string" ? message : "Check your passwords and try again.";
  }
  if (error?.status === 401) return "Your session has expired. Sign in again.";
  if (error?.status === 429) return "Too many attempts. Wait a minute and try again.";
  return "Your password could not be changed. Check your connection and try again.";
}
