/** Server-only client for the protected user account list. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import { userAccountListSchema, type UserAccount } from "./types";

export async function listUserAccounts(): Promise<UserAccount[]> {
  const response = await apiFetch<unknown>("/user-accounts", { method: "GET", cache: "no-store" });
  const result = userAccountListSchema.safeParse(response);

  if (!result.success) {
    throw new Error("The backend returned an invalid user account list.");
  }

  return result.data;
}
