/**
 * Inactivity timeout rules shared by proxy.ts and InactivityGuard (REQ-4.1-05). The last-activity
 * time lives in one cookie, so every tab and the proxy see the same value. The browser must be
 * able to write it, because working in a page without navigating never reaches the proxy. It
 * holds only a timestamp, and changing it can extend no one's session but the holder's own.
 */

export const IDLE_COOKIE_NAME = "biosphere_last_activity";

export const IDLE_WARNING_MS = 60_000;

/** The period is a deployment setting with no code default; env.ts stops a build without it. */
export function sessionIdleLimitMs(minutes = process.env.NEXT_PUBLIC_SESSION_IDLE_MINUTES) {
  const parsed = Number(minutes);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("NEXT_PUBLIC_SESSION_IDLE_MINUTES must be a positive number of minutes.");
  }
  return parsed * 60_000;
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

export type IdleAction = "none" | "warn" | "lock" | "signOut";

/**
 * What an open tab should do now. Past the limit the workspace is always hidden: online it signs
 * out, and offline, where sign-out cannot reach Supabase, it stays locked until connectivity returns.
 */
export function idleAction(
  lastActivity: number | null,
  now: number,
  limitMs: number,
  warningMs: number,
  online: boolean,
): IdleAction {
  if (lastActivity === null) return "none";
  if (isIdleExpired(lastActivity, now, limitMs)) return online ? "signOut" : "lock";
  return now - lastActivity >= limitMs - warningMs ? "warn" : "none";
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
