/**
 * Toasts for the curator and developer workspaces (sonner). One <AppToaster /> is mounted per
 * workspace layout; everything else calls notify() or renders <FlashToast />.
 *
 * Toasts are announced politely to screen readers and never carry the only copy of an error a
 * form needs: forms keep their inline error next to the field or button.
 */

"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Toaster, toast } from "sonner";

export type ToastTone = "success" | "error" | "warning";

/** Errors and warnings stay longer: they usually need reading, not just noticing. */
const DURATION_MS: Record<ToastTone, number> = { success: 5000, warning: 9000, error: 9000 };

export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      // Above the sticky top bar and its menus (z-40), below nothing else on the page.
      style={{ zIndex: 60 }}
      toastOptions={{ classNames: { toast: "font-sans" } }}
    />
  );
}

/** `id` replaces a toast already on screen with the same id instead of stacking a copy. */
export function notify(tone: ToastTone, message: string, id?: string) {
  toast[tone](message, { id, duration: DURATION_MS[tone] });
}

// Lets a form modal close itself when the action it submitted is reported as done after a redirect.
const doneListeners = new Set<() => void>();

/** Subscribe to "an action finished and its result was shown". Returns the unsubscribe function. */
export function onActionDone(listener: () => void) {
  doneListeners.add(listener);
  return () => {
    doneListeners.delete(listener);
  };
}

/**
 * Reports that an action submitted from a modal finished without a redirect, so an open
 * ModalButton closes. Call it once per finished action, after its outcome is known.
 */
export function reportActionDone() {
  for (const listener of [...doneListeners]) listener();
}

/**
 * Shows the result of an action that finished with a redirect and described its outcome in URL
 * parameters (e.g. ?notice=note-added). The server page turns those parameters into `message`;
 * this shows it once and removes the parameters, so a reload or a shared link does not repeat it.
 */
export function FlashToast({
  message,
  tone = "success",
  params,
}: {
  /** Null when the parameters are present but name no known outcome: they are still removed. */
  message: string | null;
  tone?: ToastTone;
  /** URL parameters that carry the outcome, comma separated, e.g. "notice,email". */
  params: string;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const present = params.split(",").some((name) => searchParams.has(name));

  useEffect(() => {
    if (!present) return;
    if (message) {
      // The id stops React's development double-run from showing the toast twice.
      notify(tone, message, `flash:${pathname}:${message}`);
      for (const listener of [...doneListeners]) listener();
    }
    const next = new URLSearchParams(window.location.search);
    for (const name of params.split(",")) next.delete(name);
    const query = next.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, [present, message, tone, params, pathname]);

  return null;
}

/**
 * Toasts an action's result each time a new one arrives: `success` as a success, `message` or
 * `error` as an error. For forms that are not inside a modal; a modal keeps its result inline,
 * because a toast would sit behind the modal's backdrop.
 */
export function useResultToast(state: { success?: string | null; message?: string | null; error?: string | null }) {
  useEffect(() => {
    if (state.success) notify("success", state.success);
    else if (state.message || state.error) notify("error", (state.message || state.error) as string);
  }, [state]);
}
