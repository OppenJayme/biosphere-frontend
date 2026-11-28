/**
 * A dialog for an intercepted route (`@modal/(.)…`). It opens on mount and closes by going back,
 * so the URL, Back button and refresh behave like a page: a refresh shows the full page instead.
 * Saving closes it too: the form's server action redirects to the details URL, whose modal slot
 * renders nothing.
 */

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, type ReactNode } from "react";

export function RouteModal({ title, children }: { title: string; children: ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      // Escape goes back instead of only hiding the dialog, so the URL stays in step.
      // No close on backdrop click: a stray click must not throw away typed changes.
      onCancel={(event) => {
        event.preventDefault();
        router.back();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-3xl rounded-2xl border border-black/10 bg-white p-0 text-left text-zinc-900 shadow-[0_24px_60px_-20px_rgb(20_42_31/0.45)] backdrop:bg-forest-900/50 backdrop:backdrop-blur-sm motion-safe:open:animate-[confirm-in_160ms_ease-out]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-black/10 px-5 py-4 sm:px-6">
        <h2 id={titleId} className="font-serif text-xl font-semibold text-forest-900">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Close"
          className="-mr-2 -mt-1 rounded-lg px-2.5 py-1 text-xl leading-none text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-2 focus-visible:outline-forest-700"
        >
          ×
        </button>
      </div>
      <div className="max-h-[calc(100dvh-9rem)] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
    </dialog>
  );
}
