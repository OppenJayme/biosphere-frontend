/**
 * Action button that asks for confirmation in the shared ConfirmDialog (replaces window.confirm).
 *
 * Inside a <form>, confirming submits that form (Server Action forms included), because the
 * dialog stays a DOM child of the form. The form's own validation runs first, so the question is
 * never asked about a form the browser would refuse to submit. Pressing Enter in one of the form's
 * fields asks the same question, so the keyboard cannot submit without confirming. Pass `onConfirm`
 * to run a handler instead.
 */

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ConfirmDialog, type ConfirmTone } from "@/components/ui/ConfirmDialog";
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
  tone?: ConfirmTone;
  /** Leave unset inside a <form action>: the form's own pending state is used. */
  pending?: boolean;
  /** Shown in the full-screen loading overlay while the confirmed action runs. */
  pendingLabel?: string;
  disabled?: boolean;
  /** Classes for the opening button, so it keeps its existing look. */
  className: string;
  describedBy?: string;
  title?: string;
  role?: string;
  ariaLabel?: string;
  onConfirm?: () => void;
};

export function ConfirmButton({
  label,
  question = "Are you sure?",
  detail,
  confirmLabel,
  tone = "default",
  pending: pendingProp,
  pendingLabel,
  disabled = false,
  className,
  describedBy,
  title,
  role,
  ariaLabel,
  onConfirm,
}: ConfirmButtonProps) {
  const formStatus = useFormStatus();
  // Callers that track their own pending state keep doing so. Otherwise a button that submits its
  // form follows that form; with onConfirm it acts on its own and the form is not its business.
  const followsForm = pendingProp === undefined && !onConfirm;
  const pending = pendingProp ?? (followsForm && formStatus.pending);
  const [open, setOpen] = useState(false);
  const [wasPending, setWasPending] = useState(pending);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close once the confirmed submission starts; the loading overlay takes over from there.
  if (pending !== wasPending) {
    setWasPending(pending);
    if (pending) setOpen(false);
  }

  function ask() {
    // Let the browser point at a missing or invalid field before asking to confirm.
    const form = onConfirm ? null : triggerRef.current?.form;
    if (form && !form.noValidate && !form.reportValidity()) return;
    setOpen(true);
  }

  function cancel() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Enter in a text field would submit a one-field form with no confirmation, and do nothing in a
  // longer one (the only submit button lives in the closed dialog). Route it through the question.
  const blocked = disabled || pending;
  useEffect(() => {
    const trigger = triggerRef.current;
    const form = onConfirm ? null : trigger?.form;
    if (!trigger || !form) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (event.key !== "Enter" || event.isComposing || !(target instanceof HTMLInputElement)) return;
      if (["checkbox", "radio", "file", "button", "submit", "reset"].includes(target.type)) return;
      // Inside an open dialog (this one or a nested form's), Enter keeps its normal meaning.
      if (target.closest("dialog[open]") !== trigger.closest("dialog[open]")) return;
      // A form with its own submit button keeps that button as the Enter default.
      if (form.querySelector('button[type="submit"], input[type="submit"]')) return;
      // With several confirm buttons in one form, the first one answers for Enter.
      if (form.querySelector("[data-confirm-submit]") !== trigger) return;
      event.preventDefault();
      // Clicking the trigger runs the same validity check and opens the question.
      if (!blocked) trigger.click();
    };
    form.addEventListener("keydown", onKeyDown);
    return () => form.removeEventListener("keydown", onKeyDown);
  }, [onConfirm, blocked]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role={role}
        title={title}
        disabled={disabled || pending}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-haspopup="dialog"
        data-confirm-submit={onConfirm ? undefined : ""}
        onClick={ask}
        className={className}
      >
        {label}
      </button>

      {/* A form-following button only adds the overlay when asked, since the form may show its own. */}
      <PendingOverlay pending={pending && (!followsForm || pendingLabel !== undefined)} label={pendingLabel} />

      <ConfirmDialog
        open={open}
        title={question}
        message={detail}
        confirmLabel={confirmLabel}
        tone={tone}
        onCancel={cancel}
        onConfirm={
          onConfirm
            ? () => {
                setOpen(false);
                onConfirm();
              }
            : undefined
        }
      />
    </>
  );
}
