"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons";

export function Modal({
  title,
  description,
  onClose,
  children,
  size = "default",
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** "wide" gives long forms room for two columns on desktop; phones are unchanged. */
  size?: "default" | "wide";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-y-auto overscroll-contain border-0 bg-transparent px-4 py-10 text-ink open:flex open:items-start open:justify-center backdrop:bg-forest-900/60 backdrop:backdrop-blur-sm"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "a[href], button, input, select, textarea, [tabindex]",
          ),
        ).filter(
          (element) =>
            element.tabIndex >= 0 &&
            !element.matches(":disabled") &&
            element.getClientRects().length > 0,
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`w-full ${size === "wide" ? "max-w-lg lg:max-w-5xl" : "max-w-lg"} rounded-2xl border border-line bg-surface p-6 shadow-[0_24px_60px_-20px_rgb(20_42_31/0.45)] outline-none sm:p-8`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="modal-title"
              className="font-display text-2xl font-semibold tracking-tight text-ink"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-ink-muted">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-full p-1.5 text-ink-muted hover:bg-brand-soft hover:text-brand"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 border-t border-line pt-6">{children}</div>
      </div>
    </dialog>
  );
}
