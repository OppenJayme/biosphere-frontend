/**
 * Device-local operational alerts for the curator bell (SRS REQ-4.3-05, REQ-4.3-10).
 *
 * Sync failures of offline-created drafts exist only in this browser's IndexedDB, so the
 * backend feed cannot report them. This module maps the owner's SYNC_FAILED drafts to bell
 * items, and reminds the curator about drafts still waiting to sync (team decision, 7 Nov
 * 2026). It only reads draft data: syncing, retrying or discarding stays in the offline
 * workspace.
 */

import type { OfflineSpecimenDraft } from "../offline/types";

export type LocalSyncAlert = {
  /** Prefixed so it can never collide with a backend notification id. */
  id: string;
  /** Matches the recordId of a backend SYNC_FAILED alert for the same draft. */
  clientDraftId: string;
  title: string;
  draftLabel: string;
  reason: string | null;
  updatedAt: string;
};

/** Where the bell sends the curator: the offline workspace on the specimen catalog. */
export const LOCAL_SYNC_ALERT_HREF = "/specimens#offline-records-heading";

function draftLabel(draft: OfflineSpecimenDraft["draft"]) {
  const name = draft.commonName?.trim() || draft.scientificName?.trim() || draft.accessionNumber?.trim();
  return name || "Untitled offline draft";
}

/**
 * A draft still waiting to sync this long after it was saved gets a reminder. Until it syncs
 * it exists only in this browser, so clearing site data or losing the device loses it. Synced
 * records are covered by the server's own reminder for records left Uncataloged.
 */
export const OFFLINE_DRAFT_REMINDER_HOURS = 24;

const HOUR_MS = 60 * 60 * 1000;

function waitingFor(hours: number) {
  if (hours < 48) return "more than a day";
  return `${Math.floor(hours / 24)} days`;
}

/** Oldest first: the drafts that have waited longest come first. */
export function localDraftReminders(
  drafts: readonly OfflineSpecimenDraft[],
  now: Date,
): LocalSyncAlert[] {
  return drafts
    .filter((draft) => draft.syncState === "PENDING_SYNC")
    .map((draft) => ({ draft, hours: (now.getTime() - Date.parse(draft.createdAt)) / HOUR_MS }))
    .filter(({ hours }) => Number.isFinite(hours) && hours >= OFFLINE_DRAFT_REMINDER_HOURS)
    .sort((a, b) => b.hours - a.hours)
    .map(({ draft, hours }) => ({
      id: `LOCAL_DRAFT_WAITING:${draft.clientDraftId}`,
      clientDraftId: draft.clientDraftId,
      title: "Offline draft still on this device",
      draftLabel: draftLabel(draft.draft),
      reason: `Not synced for ${waitingFor(hours)}. Open it while online so it is saved to BioSphere.`,
      updatedAt: draft.createdAt,
    }));
}

/** Newest first; drafts in any other sync state are not alerts. */
export function localSyncAlerts(drafts: readonly OfflineSpecimenDraft[]): LocalSyncAlert[] {
  return drafts
    .filter((draft) => draft.syncState === "SYNC_FAILED")
    .map((draft) => ({
      id: `LOCAL_SYNC_FAILED:${draft.clientDraftId}`,
      clientDraftId: draft.clientDraftId,
      title: "Offline draft could not sync",
      draftLabel: draftLabel(draft.draft),
      reason: draft.lastError,
      updatedAt: draft.lastAttemptAt ?? draft.updatedAt,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Drops device-local alerts that the backend feed already reports as SYNC_FAILED (a server
 * rejection of the same draft), so one failure is never shown twice.
 */
export function withoutServerReported(
  alerts: readonly LocalSyncAlert[],
  feedItems: readonly { type: string; recordId: string }[],
): LocalSyncAlert[] {
  const reported = new Set(feedItems.filter((item) => item.type === "SYNC_FAILED").map((item) => item.recordId));
  return alerts.filter((alert) => !reported.has(alert.clientDraftId));
}
