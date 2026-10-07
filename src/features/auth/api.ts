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

/**
 * Tells the backend the invited curator has set a password, so their account may use
 * protected APIs and the completion is audited (REQ-4.1-07, REQ-4.1-11). Takes the invite
 * session's access token; never the password.
 */
export async function completeOnboarding(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/onboarding/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
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
