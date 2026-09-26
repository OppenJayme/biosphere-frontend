/**
 * Full-screen "working on it" overlay shown while an action runs: blurred backdrop, the
 * BioSphere logo, a label, and an indeterminate loading bar.
 *
 * It uses a modal <dialog>, so the page behind is inert (no clicks or tabbing into it) and
 * it renders in the top layer above any other dialog. Escape cannot dismiss it.
 */

"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { LogoMark } from "@/components/layout/LogoMark";

function LoadingOverlay({ label }: { label: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-busy="true"
      aria-label={label}
      // An in-flight action cannot be cancelled, so ignore Escape.
      onCancel={(event) => event.preventDefault()}
      className="m-auto w-[calc(100%-2rem)] max-w-xs rounded-2xl border border-black/10 bg-white p-0 shadow-[0_24px_60px_-20px_rgb(20_42_31/0.45)] outline-none backdrop:bg-forest-900/45 backdrop:backdrop-blur-md"
    >
      <div role="status" aria-live="polite" className="flex flex-col items-center px-8 py-7 text-center">
        <LogoMark className="h-16 w-16 motion-safe:animate-[loading-breathe_1.8s_ease-in-out_infinite]" />
        <p className="mt-4 text-sm font-semibold text-forest-900">{label}</p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-forest-100">
          <div className="h-full w-2/5 rounded-full bg-forest-700 motion-safe:animate-[loading-bar_1.2s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:animate-pulse" />
        </div>
      </div>
    </dialog>
  );
}

/** Show the overlay while `pending` is true (for useActionState / useTransition / fetch). */
export function PendingOverlay({ pending, label = "Loading…" }: { pending: boolean; label?: string }) {
  return pending ? <LoadingOverlay label={label} /> : null;
}

/** Place inside a <form action={...}>: shows the overlay while that form is submitting. */
export function FormPendingOverlay({ label = "Loading…" }: { label?: string }) {
  const { pending } = useFormStatus();
  return <PendingOverlay pending={pending} label={label} />;
}
