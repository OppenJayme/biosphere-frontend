import "server-only";
import { apiFetch } from "@/lib/api-client";
import { env } from "@/lib/env";
import { LoginError, loginErrorCode } from "./login-error";
import { currentUserProfileSchema, type CurrentUserProfile } from "./types";

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    accountId: string;
    email: string;
    role: string;
  };
};

// Server-only: lets API_URL differ from the public one (e.g. an internal
// Docker Compose service name) without exposing it to the client.
const API_URL = process.env.API_URL ?? env.NEXT_PUBLIC_API_URL;

export async function login(email: string, password: string): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    // Network failure: the backend (or the tunnel in front of it) is unreachable.
    throw new LoginError("server_unavailable");
  }

  if (!res.ok) {
    throw new LoginError(loginErrorCode(res.status));
  }

  return res.json();
}

/** POSTs with a session the global guard would refuse, such as an invite or recovery session. */
async function postWithSession(path: string, accessToken: string, body: unknown): Promise<number | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return res.status;
  } catch {
    return null;
  }
}

/**
 * Sets the invited curator's first password, which also lets their account use protected APIs
 * and audits the completion (REQ-4.1-07, REQ-4.1-11). Returns the response status, or null when
 * the backend cannot be reached.
 */
export function completeOnboarding(accessToken: string, password: string) {
  return postWithSession("/auth/onboarding/complete", accessToken, { password });
}

/** Sets a new password with the session a reset code opened (REQ-4.1-10, REQ-4.1-11). */
export function resetPasswordWithSession(accessToken: string, newPassword: string) {
  return postWithSession("/auth/password/reset", accessToken, { newPassword });
}

/** Asks the backend to email a reset code. The answer never says whether the account exists. */
export async function requestPasswordRecovery(email: string): Promise<void> {
  await fetch(`${API_URL}/auth/password/recovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    cache: "no-store",
  }).catch(() => undefined);
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  await apiFetch<unknown>("/auth/password/change", {
    method: "POST",
    body: JSON.stringify(input),
    cache: "no-store",
  });
}

export async function getCurrentAccount(): Promise<CurrentUserProfile> {
  const response = await apiFetch<unknown>("/auth/me", {
    method: "GET",
    cache: "no-store",
  });
  const result = currentUserProfileSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid account profile response.");
  }

  return result.data;
}
