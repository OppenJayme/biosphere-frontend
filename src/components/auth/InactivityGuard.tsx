/**
 * Ends an open workspace after the configured idle period (REQ-4.1-05). Sessions with no open tab
 * are caught by proxy.ts. Offline, sign-out cannot reach Supabase, so the workspace locks instead
 * and signs out once connectivity returns. Saved drafts stay on the device.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { signOutInactive } from "@/features/auth/actions";
import {
  IDLE_WARNING_MS,
  idleAction,
  idleCookieString,
  isIdleExpired,
  lastActivityFromCookies,
  sessionIdleLimitMs,
} from "@/lib/session-idle";

const CHECK_INTERVAL_MS = 15_000;
const WRITE_THROTTLE_MS = 5_000;
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;

export function InactivityGuard() {
  const [warning, setWarning] = useState(false);
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);
  const signingOut = useRef(false);
  const lockScreen = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const limit = sessionIdleLimitMs();
    let lastWrite = 0;

    const setLock = (value: boolean) => {
      lockedRef.current = value;
      setLocked(value);
    };

    const check = () => {
      if (signingOut.current) return;

      const last = lastActivityFromCookies(document.cookie);
      const action = idleAction(last, Date.now(), limit, IDLE_WARNING_MS, navigator.onLine);
      setWarning(action === "warn");

      if (action === "lock" || action === "signOut") {
        setLock(true);
      } else if (last !== null) {
        // Another tab signed in again, which refreshed the shared cookie.
        setLock(false);
      }

      if (action === "signOut") {
        signingOut.current = true;
        signOutInactive().catch(() => {
          signingOut.current = false;
        });
      }
    };

    const record = () => {
      if (lockedRef.current) return;

      const now = Date.now();
      if (now - lastWrite < WRITE_THROTTLE_MS) return;
      lastWrite = now;

      // Activity after the limit must not restart the timer, for example on waking a laptop.
      if (isIdleExpired(lastActivityFromCookies(document.cookie), now, limit)) {
        check();
        return;
      }
      document.cookie = idleCookieString(now);
      setWarning(false);
    };

    record();
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    ACTIVITY_EVENTS.forEach((name) => window.addEventListener(name, record, { passive: true }));
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);

    return () => {
      window.clearInterval(timer);
      ACTIVITY_EVENTS.forEach((name) => window.removeEventListener(name, record));
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
    };
  }, []);

  useEffect(() => {
    if (!locked) return;

    const page = Array.from(document.body.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== lockScreen.current,
    );
    page.forEach((element) => {
      element.inert = true;
    });
    lockScreen.current?.focus();

    return () => {
      page.forEach((element) => {
        element.inert = false;
      });
    };
  }, [locked]);

  if (locked) {
    return createPortal(
      <div
        ref={lockScreen}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="idle-lock-title"
        aria-describedby="idle-lock-message"
        tabIndex={-1}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-sage-50 p-6 text-center outline-none"
      >
        <div className="max-w-md">
          <h1 id="idle-lock-title" className="text-xl font-semibold text-zinc-900">
            Workspace locked
          </h1>
          <p id="idle-lock-message" className="mt-2 text-sm text-zinc-700">
            This workspace was locked because of inactivity. Connect to the internet to sign in
            again. Saved drafts stay on this device.
          </p>
        </div>
      </div>,
      document.body,
    );
  }

  if (!warning) return null;

  return (
    <p
      role="status"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 shadow-lg"
    >
      You will be signed out in about a minute because of inactivity. Move the mouse or press a key
      to stay signed in.
    </p>
  );
}
