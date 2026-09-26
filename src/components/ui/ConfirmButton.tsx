/**
 * Action button that asks for confirmation in a centered dialog (replaces window.confirm).
 * Built on the native <dialog> element: focus is trapped inside, Escape cancels, and the
 * page behind is inert while it is open.
 *
 * Inside a <form>, confirming submits that form (Server Action forms included), because the
 * dialog stays a DOM child of the form. Pass `onConfirm` to run a handler instead.
 */

"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";

type ConfirmButtonProps = {
  /** Text of the button that opens the dialog, e.g. "Catalog specimen". */
  label: ReactNode;
  /** Dialog title, e.g. "Catalog this specimen?". */
  question?: string;
  /** Consequence line under the title. */
  detail?: ReactNode;
  /** Text of the confirm button, e.g. "Yes, catalog". */
  confirmLabel: string;
  /** "danger" styles the confirm button red and focuses Cancel first. */
  tone?: "default" | "danger";
  pending?: boolean;
  /** Shown in the full-screen loading overlay while the confirmed action runs. */
  pendingLabel?: string;
  disabled?: boolean;
  /** Classes for the opening button, so it keeps its existing look. */
  className: string;
  describedBy?: string;
  onConfirm?: () => void;
};

export function ConfirmButton({
  label,
  question = "Are you sure?",
  detail,
  confirmLabel,
  tone = "default",
  pending = false,
  pendingLabel,
  disabled = false,
  className,
  describedBy,
  onConfirm,
}: ConfirmButtonProps) {
  const [open, setOpen] = useState(false);
  const [wasPending, setWasPending] = useState(pending);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const detailId = useId();
  const danger = tone === "danger";

  // Close once the confirmed submission starts; the loading overlay takes over from there.
  if (pending !== wasPending) {
    setWasPending(pending);
    if (pending) setOpen(false);
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function cancel() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || pending}
        aria-describedby={describedBy}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={className}
      >
        {label}
      </button>

      <PendingOverlay pending={pending} label={pendingLabel} />

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={detail ? detailId : undefined}
        // Escape fires "cancel"; route it through state so React stays the source of truth.
        onCancel={(event) => {
          event.preventDefault();
          cancel();
        }}
        // Only clicks on the backdrop land on the dialog element itself.
        onClick={(event) => {
          if (event.target === event.currentTarget) cancel();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-black/10 bg-white p-0 text-left text-zinc-900 shadow-[0_24px_60px_-20px_rgb(20_42_31/0.45)] backdrop:bg-forest-900/50 backdrop:backdrop-blur-sm motion-safe:open:animate-[confirm-in_160ms_ease-out]"
      >
        {open && (
          <div className="p-6">
            <h2 id={titleId} className="font-serif text-xl font-semibold text-forest-900">
              {question}
            </h2>
            {detail && (
              <p id={detailId} className="mt-2 text-sm leading-relaxed text-zinc-600">
                {detail}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                autoFocus={danger}
                onClick={cancel}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type={onConfirm ? "button" : "submit"}
                autoFocus={!danger}
                onClick={
                  onConfirm
                    ? () => {
                        setOpen(false);
                        onConfirm();
                      }
                    : undefined
                }
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
    </>
  );
}
