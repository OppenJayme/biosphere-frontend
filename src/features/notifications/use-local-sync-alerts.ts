"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { offlineDatabase } from "../offline/database";
import type { OfflineSpecimenDraft } from "../offline/types";
import { localDraftReminders, localSyncAlerts, type LocalSyncAlert } from "./local-alerts";

/** How often a draft that has crossed the reminder age is picked up while the page stays open. */
const REMINDER_RECHECK_MS = 10 * 60 * 1000;

/**
 * Read-only subscription to this owner's failed and still-waiting offline drafts. It never
 * syncs, retries or discards (useOfflineSpecimens owns those side effects), so it is safe in
 * the topbar. Failed drafts come first, then reminders. Storage errors (private mode, blocked
 * IndexedDB) leave the list empty rather than breaking the bell.
 */
export function useLocalSyncAlerts(ownerId: string): LocalSyncAlert[] {
  const [drafts, setDrafts] = useState<OfflineSpecimenDraft[]>([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const subscription = liveQuery(() =>
      offlineDatabase.specimenDrafts
        .where("[ownerId+syncState]")
        .anyOf([
          [ownerId, "SYNC_FAILED"],
          [ownerId, "PENDING_SYNC"],
        ])
        .toArray(),
    ).subscribe({
      next: (rows) => {
        setDrafts(rows);
        setNow(new Date());
      },
      error: () => setDrafts([]),
    });
    return () => subscription.unsubscribe();
  }, [ownerId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), REMINDER_RECHECK_MS);
    return () => window.clearInterval(timer);
  }, []);

  return [...localSyncAlerts(drafts), ...localDraftReminders(drafts, now)];
}
