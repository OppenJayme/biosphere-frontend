/** Server-only client for the protected curator account list, invitations and status changes. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import type { CuratorStatusInput, InviteCuratorInput } from "./form";
import { userAccountListSchema, userAccountSchema, type UserAccount } from "./types";

export async function listUserAccounts(): Promise<UserAccount[]> {
  const response = await apiFetch<unknown>("/user-accounts", { method: "GET", cache: "no-store" });
  const result = userAccountListSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid user account list.");
  }

  return result.data;
}

/** PATCH /user-accounts/:id/status: a curator activates or deactivates another curator (REQ-4.1-08). */
export async function updateCuratorStatus(id: string, input: CuratorStatusInput): Promise<UserAccount> {
  const response = await apiFetch<unknown>(`/user-accounts/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  const result = userAccountSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid curator status response.");
  }

  return result.data;
}

/** POST /user-accounts/invitations: a curator invites another curator (REQ-4.1-07). */
export async function inviteCurator(input: InviteCuratorInput): Promise<UserAccount> {
  const response = await apiFetch<unknown>("/user-accounts/invitations", {
    method: "POST",
    body: JSON.stringify(input),
  });
  const result = userAccountSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid curator invitation response.");
  }

  return result.data;
}
