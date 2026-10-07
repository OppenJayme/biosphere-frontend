/**
 * "Invite curator" (REQ-4.1-07): an authorized curator starts a separate account for another
 * curator. The backend emails a password-setup link; no password is ever entered here.
 */

"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { CloseIcon, PlusIcon } from "@/components/icons";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import { inviteCuratorAction } from "@/features/user-accounts/actions";
import {
  EMPTY_INVITE_VALUES,
  FULL_NAME_MAX_LENGTH,
  type InviteCuratorState,
} from "@/features/user-accounts/form";

const inputClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 aria-[invalid=true]:border-red-400";

const primaryButtonClasses =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClasses =
  "inline-flex items-center justify-center rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2";

function FieldMessage({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs font-medium text-red-700">
      {message}
    </p>
  );
}

function invalidProps(id: string, message?: string) {
  return message ? { "aria-invalid": true as const, "aria-describedby": id } : {};
}

export function InviteCuratorDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<InviteCuratorState, FormData>(inviteCuratorAction, {
    values: EMPTY_INVITE_VALUES,
  });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const fieldId = useId();
  const errors = state.errors ?? {};
  const id = (name: string) => `${fieldId}-${name}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={primaryButtonClasses}
      >
        <PlusIcon className="h-4 w-4" />
        Invite curator
      </button>

      <PendingOverlay pending={pending} label="Sending invitation…" />

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-black/10 bg-white p-0 text-left text-zinc-900 shadow-[0_24px_60px_-20px_rgb(20_42_31/0.45)] backdrop:bg-forest-900/50 backdrop:backdrop-blur-sm"
      >
        {open && (
          // key clears the uncontrolled inputs after a successful invitation.
          <form key={state.success ?? "invite"} action={formAction} noValidate className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="font-serif text-xl font-semibold text-forest-900">
                  Invite a curator
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Creates a separate curator account and emails a secure password-setup link. The new
                  curator sets their own password; it is never entered or sent here.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="shrink-0 rounded-full p-1.5 text-zinc-500 hover:bg-sage-100"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Only invite someone the museum&apos;s approved onboarding procedure authorizes as a curator.
            </p>

            <div>
              <label htmlFor={id("fullName")} className="text-xs font-medium text-zinc-700">
                Full name
              </label>
              <input
                id={id("fullName")}
                name="fullName"
                defaultValue={state.values.fullName}
                maxLength={FULL_NAME_MAX_LENGTH}
                autoComplete="off"
                aria-required="true"
                className={inputClasses}
                {...invalidProps(id("fullName-error"), errors.fullName)}
              />
              <FieldMessage id={id("fullName-error")} message={errors.fullName} />
            </div>

            <div>
              <label htmlFor={id("email")} className="text-xs font-medium text-zinc-700">
                Email address
              </label>
              <input
                id={id("email")}
                name="email"
                type="email"
                defaultValue={state.values.email}
                maxLength={255}
                autoComplete="off"
                aria-required="true"
                className={inputClasses}
                {...invalidProps(id("email-error"), errors.email)}
              />
              <FieldMessage id={id("email-error")} message={errors.email} />
            </div>

            {state.message && (
              <p role="alert" className="text-xs font-medium text-red-700">
                {state.message}
              </p>
            )}
            {state.success && (
              <p role="status" className="text-xs font-medium text-emerald-700">
                {state.success}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={close} className={secondaryButtonClasses}>
                {state.success ? "Done" : "Cancel"}
              </button>
              <button type="submit" disabled={pending} className={primaryButtonClasses}>
                Send invitation
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}
