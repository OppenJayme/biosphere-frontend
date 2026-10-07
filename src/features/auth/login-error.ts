/**
 * Why a sign-in failed, as the ?error= code the login page shows. Only a 401/403 blames the
 * credentials; an unreachable or failing backend says so, instead of looking like a wrong password.
 */

export type LoginErrorCode = "invalid_credentials" | "too_many_attempts" | "server_unavailable";

export class LoginError extends Error {
  constructor(public readonly code: LoginErrorCode) {
    super(`Sign-in failed: ${code}`);
    this.name = "LoginError";
  }
}

/** The error code for a failed /auth/login response status. */
export function loginErrorCode(status: number): LoginErrorCode {
  if (status === 401 || status === 403) return "invalid_credentials";
  if (status === 429) return "too_many_attempts";
  return "server_unavailable";
}
