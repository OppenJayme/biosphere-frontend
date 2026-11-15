/**
 * A button that opens a form in a centered modal, so an action's fields are not always on the
 * page. Built on the native <dialog> element: focus is trapped, Escape closes it, and the page
 * behind is inert.
 *
 * The content stays mounted while the modal is closed, so a half-written message survives closing
 * it by accident. Clicking the backdrop does not close it for the same reason. Give it a `key`
 * (e.g. the record id) to start empty for another record.
 *
 * It closes itself when a submitted action is reported as done (see onActionDone in toast.tsx).
 */

"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons";
import { onActionDone } from "@/components/ui/toast";

const WIDTHS = { md: "max-w-lg", lg: "max-w-2xl" } as const;

export function ModalButton({
  label,
  title,
  description,
  className,
  size = "md",
  disabled = false,
  children,
}: {
  /** Content of the button that opens the modal. */
  label: ReactNode;
  title: string;
  description?: ReactNode;
  /** Classes for the opening button. */
  className: string;
  size?: keyof typeof WIDTHS;
  disabled?: boolean;
  children: ReactNode;
}) {
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

  useEffect(() => {
    if (!open) return;
    return onActionDone(() => setOpen(false));
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
        disabled={disabled}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={className}
      >
        {label}
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          // Escape inside a nested confirmation belongs to that dialog, not this one.
          if (event.target === event.currentTarget) close();
        }}
        className={`m-auto w-[calc(100%-2rem)] ${WIDTHS[size]} rounded-2xl border border-black/10 bg-white p-0 text-left text-zinc-900 shadow-[0_24px_60px_-20px_rgb(20_42_31/0.45)] backdrop:bg-forest-900/50 backdrop:backdrop-blur-sm motion-safe:open:animate-[confirm-in_160ms_ease-out]`}
      >
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="font-serif text-xl font-semibold text-forest-900">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-zinc-600">{description}</p>}
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="shrink-0 rounded-full p-1.5 text-zinc-500 hover:bg-sage-100 focus-visible:outline-2 focus-visible:outline-forest-700"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4">{children}</div>
        </div>
      </dialog>
    </>
  );
}
