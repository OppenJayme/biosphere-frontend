/**
 * The signed-in curator hands over to a successor (REQ-4.1-09), as the Curator described it on
 * 2026-11-07: the outgoing curator turns everything over and steps away. The successor keeps their
 * own account; no credentials move. The outgoing account becomes inactive and is kept, so past
 * records still show who did what. The backend stays authoritative for every rule.
 */

"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { signOut } from "@/features/auth/actions";
import { handOverAction } from "@/features/user-accounts/actions";
import { EMPTY_HANDOVER_STATE, REASON_MAX_LENGTH, type HandoverState } from "@/features/user-accounts/form";
import type { AccountUser } from "@/features/user-accounts/types";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
const fieldClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 aria-[invalid=true]:border-red-400";
const secondaryButtonClasses = `inline-flex items-center justify-center rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100 focus-visible:ring-forest-700 ${focusRing}`;

/** Mounted only while the dialog is open, so every opening starts clean. */
function HandoverForm({
  successors,
  titleId,
  onClose,
}: {
  successors: AccountUser[];
  titleId: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<HandoverState, FormData>(
    handOverAction,
    EMPTY_HANDOVER_STATE,
  );
  const successorId = useId();
  const reasonId = useId();

  if (state.success) {
    return (
      <div className="space-y-4 p-6">
        <h2 id={titleId} className="font-serif text-xl font-semibold text-forest-900">
          Handover recorded
        </h2>
        <p role="status" className="text-sm text-zinc-700">
          {state.success} Sign out to finish.
        </p>
        <form action={signOut} className="flex justify-end">
          <button
            type="submit"
            className={`inline-flex items-center justify-center rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:ring-forest-700 ${focusRing}`}
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-4 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={titleId} className="font-serif text-xl font-semibold text-forest-900">
            Hand over your account?
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Your successor keeps working in their own account. Yours becomes inactive right away and is
            kept, so past records still show your name.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="shrink-0 rounded-full p-1.5 text-zinc-500 hover:bg-sage-100"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div>
        <label htmlFor={successorId} className="text-xs font-medium text-zinc-700">
          Successor
        </label>
        <select
          id={successorId}
          name="successorAccountId"
          defaultValue={state.successorAccountId}
          aria-required="true"
          aria-invalid={state.errors?.successorAccountId ? true : undefined}
          aria-describedby={state.errors?.successorAccountId ? `${successorId}-error` : undefined}
          className={fieldClasses}
        >
          <option value="">Choose an active curator</option>
          {successors.map((curator) => (
            <option key={curator.id} value={curator.id}>
              {curator.name}
              {curator.email ? ` (${curator.email})` : ""}
            </option>
          ))}
        </select>
        {state.errors?.successorAccountId && (
          <p id={`${successorId}-error`} className="mt-1 text-xs font-medium text-red-700">
            {state.errors.successorAccountId}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={reasonId} className="text-xs font-medium text-zinc-700">
          Reason
        </label>
        <textarea
          id={reasonId}
          name="reason"
          rows={3}
          defaultValue={state.reason}
          maxLength={REASON_MAX_LENGTH}
          placeholder="e.g. Retiring on 30 June 2027"
          aria-required="true"
          aria-invalid={state.errors?.reason ? true : undefined}
          aria-describedby={state.errors?.reason ? `${reasonId}-error` : undefined}
          className={fieldClasses}
        />
        {state.errors?.reason ? (
          <p id={`${reasonId}-error`} className="mt-1 text-xs font-medium text-red-700">
            {state.errors.reason}
          </p>
        ) : (
          <p className="mt-1 text-xs text-zinc-500">Saved in the audit log with your successor&apos;s name.</p>
        )}
      </div>

      {state.message && (
        <p role="alert" className="text-xs font-medium text-red-700">
          {state.message}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onClose} className={secondaryButtonClasses}>
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className={`inline-flex items-center justify-center rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:ring-red-600 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
        >
          {pending ? "Saving…" : "Hand over and deactivate my account"}
        </button>
      </div>
    </form>
  );
}

export function HandoverDialog({ successors }: { successors: AccountUser[] }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

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

  if (successors.length === 0) {
    return (
      <p className="mt-3 rounded-lg bg-sage-50 p-2.5 text-[11px] leading-relaxed text-zinc-600">
        To hand over before leaving, first invite your successor. Once they have set up their account
        and signed in, you can hand over here.
      </p>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={`mt-3 inline-flex w-full items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 focus-visible:ring-red-600 ${focusRing}`}
      >
        Hand over my account
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-black/10 bg-white p-0 text-left text-zinc-900 shadow-[0_24px_60px_-20px_rgb(20_42_31/0.45)] backdrop:bg-forest-900/50 backdrop:backdrop-blur-sm"
      >
        {open && <HandoverForm successors={successors} titleId={titleId} onClose={close} />}
      </dialog>
    </>
  );
}
