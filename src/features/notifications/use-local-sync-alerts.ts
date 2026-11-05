"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { offlineDatabase } from "../offline/database";
import { localSyncAlerts, type LocalSyncAlert } from "./local-alerts";

/**
 * Read-only subscription to this owner's failed offline drafts. It never syncs, retries or
 * discards (useOfflineSpecimens owns those side effects), so it is safe in the topbar.
 * Storage errors (private mode, blocked IndexedDB) leave the list empty rather than
 * breaking the bell.
 */
export function useLocalSyncAlerts(ownerId: string): LocalSyncAlert[] {
  const [alerts, setAlerts] = useState<LocalSyncAlert[]>([]);

  useEffect(() => {
    const subscription = liveQuery(() =>
      offlineDatabase.specimenDrafts.where("[ownerId+syncState]").equals([ownerId, "SYNC_FAILED"]).toArray(),
    ).subscribe({
      next: (drafts) => setAlerts(localSyncAlerts(drafts)),
      error: () => setAlerts([]),
    });
    return () => subscription.unsubscribe();
  }, [ownerId]);

  return alerts;
}
