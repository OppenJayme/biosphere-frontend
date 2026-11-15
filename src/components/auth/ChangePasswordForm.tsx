/** Changes the signed-in user's own password (REQ-4.1-16); shared by curators and Developers. */

"use client";

import { useActionState } from "react";
import { PasswordField } from "@/components/auth/PasswordField";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { changePasswordAction } from "@/features/auth/actions";
import type { ChangePasswordState } from "@/features/auth/change-password";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(changePasswordAction, {});

  return (
    <form action={action} className="max-w-md space-y-5 rounded-xl border border-black/10 bg-white p-5">
      {state.message && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <PasswordField
        id="currentPassword"
        name="currentPassword"
        label="Current Password"
        autoComplete="current-password"
        required
      />
      <PasswordField
        id="newPassword"
        name="newPassword"
        label="New Password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
      />
      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm New Password"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
      />

      <p className="text-xs text-zinc-600">
        Changing your password signs you out everywhere, and we email you a confirmation.
      </p>
      <ConfirmButton
        label="Change Password"
        question="Change your password?"
        detail="You will be signed out everywhere, and we email you a confirmation."
        confirmLabel="Change password"
        pending={pending}
        pendingLabel="Changing password…"
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-solid px-5 py-3 text-sm font-semibold whitespace-nowrap text-white transition-[background-color,color,transform] duration-200 hover:bg-brand-solid-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 active:translate-y-px disabled:pointer-events-none disabled:opacity-50"
      />
    </form>
  );
}
