/**
 * Activate or deactivate another curator (REQ-4.1-08). The backend stays authoritative: it refuses
 * a curator's own account and records the reason in the audit log.
 */

"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { updateCuratorStatusAction } from "@/features/user-accounts/actions";
import {
  EMPTY_CURATOR_STATUS_STATE,
  REASON_MAX_LENGTH,
  type CuratorStatusState,
} from "@/features/user-accounts/form";
import type { AccountUser } from "@/features/user-accounts/types";
import { curatorStatusAction, type CuratorStatusChange } from "@/features/user-accounts/view";

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const TRIGGER_CLASSES: Record<CuratorStatusChange["tone"], string> = {
  danger: `border-red-200 text-red-700 hover:bg-red-50 focus-visible:ring-red-600 ${focusRing}`,
  primary: `border-forest-700/30 text-forest-800 hover:bg-sage-100 focus-visible:ring-forest-700 ${focusRing}`,
};

const CONFIRM_CLASSES: Record<CuratorStatusChange["tone"], string> = {
  danger: `bg-red-700 hover:bg-red-800 focus-visible:ring-red-600 ${focusRing}`,
  primary: `bg-forest-700 hover:bg-forest-800 focus-visible:ring-forest-700 ${focusRing}`,
};

const secondaryButtonClasses =
  "inline-flex items-center justify-center rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2";

/**
 * Mounted only while the dialog is open, so every opening starts clean. `change` is fixed at that
 * moment: the saved status arrives through the page refresh and must not flip this form's wording.
 */
function CuratorStatusForm({
  user,
  change,
  titleId,
  onClose,
}: {
  user: AccountUser;
  change: CuratorStatusChange;
  titleId: string;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<CuratorStatusState, FormData>(
    updateCuratorStatusAction,
    EMPTY_CURATOR_STATUS_STATE,
  );
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  if (state.success) {
    return (
      <div className="space-y-4 p-6">
        <h2 id={titleId} className="font-serif text-xl font-semibold text-forest-900">
          {change.doneTitle}
        </h2>
        <p role="status" className="text-sm text-zinc-700">
          {state.success}
        </p>
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={secondaryButtonClasses}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-4 p-6">
      <input type="hidden" name="accountId" value={user.id} />
      <input type="hidden" name="status" value={change.status} />
      <input type="hidden" name="name" value={user.name} />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={titleId} className="font-serif text-xl font-semibold text-forest-900">
            {change.label} {user.name}?
          </h2>
          <p className="mt-1 text-sm text-zinc-600">{change.description}</p>
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

      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
        Only do this under the museum&apos;s approved account procedure.
      </p>

      <div>
        <label htmlFor={fieldId} className="text-xs font-medium text-zinc-700">
          Reason
        </label>
        <textarea
          id={fieldId}
          name="reason"
          rows={3}
          defaultValue={state.reason}
          maxLength={REASON_MAX_LENGTH}
          aria-required="true"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
          className="mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 aria-[invalid=true]:border-red-400"
        />
        {state.error ? (
          <p id={errorId} className="mt-1 text-xs font-medium text-red-700">
            {state.error}
          </p>
        ) : (
          <p className="mt-1 text-xs text-zinc-500">Saved in the audit log.</p>
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
          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${CONFIRM_CLASSES[change.tone]}`}
        >
          {pending ? "Saving…" : change.label}
        </button>
      </div>
    </form>
  );
}

export function CuratorStatusDialog({ user }: { user: AccountUser }) {
  const [openChange, setOpenChange] = useState<CuratorStatusChange | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const change = curatorStatusAction(user.status);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (openChange && !dialog.open) dialog.showModal();
    if (!openChange && dialog.open) dialog.close();
  }, [openChange]);

  function close() {
    setOpenChange(null);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpenChange(change)}
        className={`mt-3 inline-flex w-full items-center justify-center rounded-lg border px-3 py-2 text-xs font-semibold ${TRIGGER_CLASSES[change.tone]}`}
      >
        {change.label} account
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
        {openChange && <CuratorStatusForm user={user} change={openChange} titleId={titleId} onClose={close} />}
      </dialog>
    </>
  );
}
