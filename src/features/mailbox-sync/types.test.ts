import { describe, expect, it } from "vitest";
import {
  isMailboxSyncActive,
  lastCheckFailed,
  mailboxRunError,
  mailboxRunMessage,
  mailboxSyncStatusSchema,
  type MailboxSyncStatus,
} from "./types";

const status: MailboxSyncStatus = {
  enabled: true,
  configured: true,
  mailbox: "museum@example.test",
  intervalSeconds: 120,
  lastCheckedAt: "2026-11-11T04:02:00.000Z",
  lastSuccessAt: "2026-11-11T04:02:00.000Z",
  lastMessageAt: "2026-11-11T03:55:00.000Z",
  lastError: null,
};

describe("mailbox reply import status", () => {
  it("parses the status response and rejects an unexpected shape", () => {
    expect(mailboxSyncStatusSchema.parse(status)).toEqual(status);
    expect(mailboxSyncStatusSchema.safeParse({ ...status, intervalSeconds: "120" }).success).toBe(false);
  });

  it("is active only when switched on and set up", () => {
    expect(isMailboxSyncActive(status)).toBe(true);
    expect(isMailboxSyncActive({ ...status, enabled: false })).toBe(false);
    expect(isMailboxSyncActive({ ...status, configured: false })).toBe(false);
  });

  it("flags a failed newest check, but not an old error after a later success", () => {
    expect(lastCheckFailed(status)).toBe(false);
    expect(
      lastCheckFailed({ ...status, lastError: "invalid_grant", lastCheckedAt: "2026-11-11T04:04:00.000Z" }),
    ).toBe(true);
    expect(lastCheckFailed({ ...status, lastError: "invalid_grant", lastSuccessAt: null })).toBe(true);
    expect(lastCheckFailed({ ...status, lastError: "old failure" })).toBe(false);
  });

  it("describes a manual run in plain words", () => {
    expect(mailboxRunMessage({ checked: 4, imported: 0, skipped: 4 })).toMatch(/No new visitor replies/);
    expect(mailboxRunMessage({ checked: 4, imported: 1, skipped: 3 })).toBe(
      "1 new visitor reply was added to the history.",
    );
    expect(mailboxRunMessage({ checked: 9, imported: 2, skipped: 7 })).toMatch(/^2 new visitor replies/);
  });

  it("handles a 503 when reply checking is not set up, and other failures", () => {
    expect(mailboxRunError(503, "Mailbox sync is not set up on this server.")).toMatch(/not set up on the server yet/);
    expect(mailboxRunError(503, "The mailbox could not be checked: token expired")).toMatch(/try again in a few minutes/);
    expect(mailboxRunError(429)).toMatch(/Wait a minute/);
    expect(mailboxRunError(403)).toMatch(/Only curators/);
    expect(mailboxRunError(500)).toMatch(/server could not check/);
    expect(mailboxRunError(null)).toMatch(/Check your connection/);
  });
});
