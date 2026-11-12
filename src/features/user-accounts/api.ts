/** Server-only client for the protected curator account list, invitations and invitation resends. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import type { InviteCuratorInput } from "./form";
import { userAccountListSchema, userAccountSchema, type UserAccount } from "./types";

export async function listUserAccounts(): Promise<UserAccount[]> {
  const response = await apiFetch<unknown>("/user-accounts", { method: "GET", cache: "no-store" });
  const result = userAccountListSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid user account list.");
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

/** POST /user-accounts/:id/resend-invitation: emails a new link while the invitation is pending. */
export async function resendInvitation(accountId: string): Promise<UserAccount> {
  const response = await apiFetch<unknown>(`/user-accounts/${encodeURIComponent(accountId)}/resend-invitation`, {
    method: "POST",
  });
  const result = userAccountSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid invitation resend response.");
  }

  return result.data;
}
