/**
 * Inactivity timeout rules shared by proxy.ts and InactivityGuard (REQ-4.1-05). The last-activity
 * time lives in one cookie, so every tab and the proxy see the same value. The browser must be
 * able to write it, because working in a page without navigating never reaches the proxy. It
 * holds only a timestamp, and changing it can extend no one's session but the holder's own.
 */

export const IDLE_COOKIE_NAME = "biosphere_last_activity";

// Placeholder until the museum approves a period; set NEXT_PUBLIC_SESSION_IDLE_MINUTES to change it.
const DEFAULT_IDLE_MINUTES = 30;

export const IDLE_WARNING_MS = 60_000;

export function sessionIdleLimitMs(minutes = process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES) {
  const parsed = Number(minutes);
  return (Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_IDLE_MINUTES) * 60_000;
}

export function parseLastActivity(value: string | undefined | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/** A session with no recorded activity has only just started, so it has not expired. */
export function isIdleExpired(lastActivity: number | null, now: number, limitMs: number) {
  return lastActivity !== null && now - lastActivity >= limitMs;
}

export function idleCookieOptions() {
  return {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  } as const;
}

/** The document.cookie assignment that records activity from the browser. */
export function idleCookieString(now: number) {
  const secure = idleCookieOptions().secure ? "; Secure" : "";
  return `${IDLE_COOKIE_NAME}=${now}; Path=/; SameSite=Lax${secure}`;
}

/** Reads the last-activity time out of a document.cookie string. */
export function lastActivityFromCookies(cookieHeader: string) {
  const entry = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${IDLE_COOKIE_NAME}=`));
  return parseLastActivity(entry?.slice(IDLE_COOKIE_NAME.length + 1));
}
