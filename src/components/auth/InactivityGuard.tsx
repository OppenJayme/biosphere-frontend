/**
 * Signs out an open workspace after the approved idle period (REQ-4.1-05). Sessions with no open
 * tab are caught by proxy.ts. While offline it waits instead of signing out, so a curator using
 * cached records and drafts is not interrupted; the check runs again once back online.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { signOutInactive } from "@/features/auth/actions";
import {
  IDLE_WARNING_MS,
  idleCookieString,
  lastActivityFromCookies,
  sessionIdleLimitMs,
} from "@/lib/session-idle";

const CHECK_INTERVAL_MS = 15_000;
const WRITE_THROTTLE_MS = 5_000;
const ACTIVITY_EVENTS = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;

export function InactivityGuard() {
  const [warning, setWarning] = useState(false);
  const signingOut = useRef(false);

  useEffect(() => {
    const limit = sessionIdleLimitMs();
    let lastWrite = 0;

    const record = () => {
      const now = Date.now();
      if (now - lastWrite < WRITE_THROTTLE_MS) return;
      lastWrite = now;
      document.cookie = idleCookieString(now);
      setWarning(false);
    };

    const check = () => {
      const last = lastActivityFromCookies(document.cookie);
      if (last === null || signingOut.current) return;

      const idle = Date.now() - last;
      if (idle < limit) {
        setWarning(idle >= limit - IDLE_WARNING_MS);
        return;
      }
      if (!navigator.onLine) return;

      signingOut.current = true;
      signOutInactive().catch(() => {
        signingOut.current = false;
      });
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
