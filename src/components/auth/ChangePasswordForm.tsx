/** Changes the signed-in user's own password (REQ-4.1-16); shared by curators and Developers. */

"use client";

import { useActionState } from "react";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/Button";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import { changePasswordAction } from "@/features/auth/actions";
import type { ChangePasswordState } from "@/features/auth/change-password";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<ChangePasswordState, FormData>(changePasswordAction, {});

  return (
    <form action={action} className="max-w-md space-y-5 rounded-xl border border-black/10 bg-white p-5">
      <PendingOverlay pending={pending} label="Changing password…" />
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
      <Button type="submit" radius="lg" disabled={pending}>
        Change Password
      </Button>
    </form>
  );
}
