/**
 * The one confirmation dialog used across the curator and developer workspaces: a title, a short
 * message, Cancel and Confirm. Destructive actions pass tone="danger" for a red Confirm button,
 * and Cancel takes focus first so Enter cannot confirm by accident.
 *
 * Built on the native <dialog> element: focus is trapped inside, Escape cancels, and the page
 * behind is inert while it is open. It is controlled by `open`; use ConfirmButton when the dialog
 * should come with its own trigger button.
 *
 * Without `onConfirm`, the Confirm button is a submit button. Rendered inside a <form>, it submits
 * that form (Server Action forms included), because the dialog stays a DOM child of the form.
 */

"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

export type ConfirmTone = "default" | "danger";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  /** The question, e.g. "Send this email?". */
  title: string;
  /** One or two sentences on what will happen. */
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  onCancel: () => void;
  /** Runs on Confirm. Leave unset inside a <form> to submit that form instead. */
  onConfirm?: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();
  const danger = tone === "danger";

  // Where focus was when the dialog opened, so keyboard users land back there when it closes.
  // Without this, a dialog opened from a menu item leaves focus on the page body.
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
      const target = returnFocusRef.current;
      returnFocusRef.current = null;
      // Only when nothing else took focus meanwhile (an owner may focus its own trigger).
      if (target?.isConnected && (document.activeElement === document.body || document.activeElement === null)) {
        target.focus({ preventScroll: true });
      }
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={message ? messageId : undefined}
      // Escape fires "cancel"; route it through the owner so React stays the source of truth.
      onCancel={(event) => {
        event.preventDefault();
        // A nested dialog's cancel bubbles; only answer for this one.
        if (event.target === event.currentTarget) onCancel();
      }}
      // Only clicks on the backdrop land on the dialog element itself.
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-black/10 bg-white p-0 text-left text-zinc-900 shadow-[0_24px_60px_-20px_rgb(20_42_31/0.45)] backdrop:bg-forest-900/50 backdrop:backdrop-blur-sm motion-safe:open:animate-[confirm-in_160ms_ease-out]"
    >
      {open && (
        <div className="p-6">
          <h2 id={titleId} className="font-serif text-xl font-semibold text-forest-900">
            {title}
          </h2>
          {message && (
            <p id={messageId} className="mt-2 text-sm leading-relaxed font-normal whitespace-normal text-zinc-600">
              {message}
            </p>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              autoFocus={danger}
              onClick={onCancel}
              className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2"
            >
              {cancelLabel}
            </button>
            <button
              type={onConfirm ? "button" : "submit"}
              autoFocus={!danger}
              onClick={onConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                danger
                  ? "bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
                  : "bg-forest-700 hover:bg-forest-800 focus-visible:ring-forest-700"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
