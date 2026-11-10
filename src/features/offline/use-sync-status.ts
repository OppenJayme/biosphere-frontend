"use client";

import { liveQuery } from "dexie";
import { useEffect, useState, useSyncExternalStore } from "react";
import { offlineDatabase } from "./database";

function subscribeToConnectivity(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

// Read-only: reports the offline cache's freshness without running any sync
// side effects (useOfflineSpecimens already owns those on the pages that
// manage drafts). Safe to mount alongside it without duplicating syncs.
export function useSyncStatus(ownerId: string) {
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const online = useSyncExternalStore(subscribeToConnectivity, getOnlineSnapshot, getServerOnlineSnapshot);

  useEffect(() => {
    const subscription = liveQuery(async () => {
      const cached = await offlineDatabase.specimenCache.where("ownerId").equals(ownerId).toArray();
      if (cached.length === 0) return null;
      return cached.reduce((latest, record) => (record.cachedAt > latest ? record.cachedAt : latest), cached[0].cachedAt);
    }).subscribe({
      next: setLastSyncedAt,
      error: () => setLastSyncedAt(null),
    });

    return () => subscription.unsubscribe();
  }, [ownerId]);

  return { online, lastSyncedAt };
}
