import "server-only";
import { getCurrentAccount } from "@/features/auth/api";
import type { CurrentUserProfile } from "@/features/auth/types";
import { verifySession } from "@/lib/session";

export type DeveloperAccess =
  | { state: "signed-out" }
  | { state: "unavailable" }
  | { state: "not-developer"; profile: CurrentUserProfile }
  | { state: "developer"; profile: CurrentUserProfile };

/**
 * Resolves the role from the backend's /auth/me (never the UI-hint account cookie).
 * This only decides what to render; every /developer endpoint re-checks the role itself.
 */
export async function getDeveloperAccess(): Promise<DeveloperAccess> {
  if (!(await verifySession())) return { state: "signed-out" };

  let profile: CurrentUserProfile;
  try {
    profile = await getCurrentAccount();
  } catch {
    return { state: "unavailable" };
  }

  return profile.role === "DEVELOPER"
    ? { state: "developer", profile }
    : { state: "not-developer", profile };
}
