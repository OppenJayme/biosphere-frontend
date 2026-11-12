/**
 * Museum mailbox reply import status (backend spec 0002 AC-8, AC-10). The backend reads the museum
 * Gmail read only and copies matched visitor replies into inquiry and visit request history. No
 * credential is ever part of this response.
 */

import { z } from "zod";

export const mailboxSyncStatusSchema = z.object({
  enabled: z.boolean(),
  configured: z.boolean(),
  mailbox: z.string().nullable(),
  intervalSeconds: z.number().int().positive(),
  lastCheckedAt: z.string().nullable(),
  lastSuccessAt: z.string().nullable(),
  lastMessageAt: z.string().nullable(),
  lastError: z.string().nullable(),
});

export const mailboxSyncResultSchema = z.object({
  checked: z.number().int().nonnegative(),
  imported: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
});

export type MailboxSyncStatus = z.infer<typeof mailboxSyncStatusSchema>;
export type MailboxSyncResult = z.infer<typeof mailboxSyncResultSchema>;

/** Replies are imported only when the server has the sync switched on and the Gmail access set up. */
export function isMailboxSyncActive(status: MailboxSyncStatus) {
  return status.enabled && status.configured;
}

/** True when the newest check failed, so replies after the last good check may be missing. */
export function lastCheckFailed(status: MailboxSyncStatus) {
  if (!status.lastError || !status.lastCheckedAt) return false;
  return !status.lastSuccessAt || status.lastCheckedAt > status.lastSuccessAt;
}

/** The message the Check for replies button shows after a run. */
export function mailboxRunMessage(result: MailboxSyncResult) {
  if (result.imported === 0) return "No new visitor replies. The history below is up to date.";
  return result.imported === 1
    ? "1 new visitor reply was added to the history."
    : `${result.imported.toLocaleString()} new visitor replies were added to the history.`;
}

/** A failed manual check, in curator words. `status` is the backend's HTTP status, or null for no answer. */
export function mailboxRunError(status: number | null, backendMessage?: string) {
  if (status === 503) {
    return backendMessage && /not set up/i.test(backendMessage)
      ? "Reply checking is not set up on the server yet, so visitor replies stay in the museum mailbox for now."
      : "The museum mailbox could not be checked just now. Nothing was lost; try again in a few minutes.";
  }
  if (status === 429) return "Replies were checked several times in the last minute. Wait a minute, then try again.";
  if (status === 403) return "Only curators can check for visitor replies.";
  // Any other server error, e.g. the reply import tables not on this database yet.
  if (status !== null && status >= 500) {
    return "The server could not check for replies right now. Nothing was changed; try again later.";
  }
  return "Replies could not be checked. Check your connection and try again.";
}
