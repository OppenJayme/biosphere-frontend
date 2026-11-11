/** Server-only client for the curator mailbox reply import endpoints (backend spec 0002). */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import { parseResponse as parse } from "../public-submissions/parse";
import { mailboxSyncResultSchema, mailboxSyncStatusSchema } from "./types";

export async function getMailboxSyncStatus() {
  const response = await apiFetch<unknown>("/mailbox-sync/status", { method: "GET", cache: "no-store" });
  return parse(mailboxSyncStatusSchema, response, "mailbox sync status");
}

/** Checks the museum mailbox now. 503 when the sync is not set up or Gmail failed; 429 past 6 per minute. */
export async function runMailboxSync() {
  const response = await apiFetch<unknown>("/mailbox-sync/run", { method: "POST" });
  return parse(mailboxSyncResultSchema, response, "mailbox sync result");
}
