"use client";

import { liveQuery } from "dexie";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { offlineDatabase } from "./database";
import {
  createOfflineDraft,
  discardOfflineDraft,
  recoverInterruptedSynchronizations,
  updateOfflineDraft,
} from "./store";
import {
  refreshSpecimenCache,
  synchronizeDraft,
  synchronizeEligibleDrafts,
} from "./sync";
import type {
  CachedSpecimen,
  OfflineSpecimenDraft,
  SpecimenDraftData,
} from "./types";

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

export function useOfflineSpecimens(ownerId: string) {
  const [drafts, setDrafts] = useState<OfflineSpecimenDraft[]>([]);
  const [cachedSpecimens, setCachedSpecimens] = useState<CachedSpecimen[]>([]);
  const [isSynchronizing, setIsSynchronizing] = useState(false);
  const operationInProgress = useRef(false);
  const online = useSyncExternalStore(
    subscribeToConnectivity,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );

  useEffect(() => {
    void recoverInterruptedSynchronizations(offlineDatabase, ownerId);

    const draftSubscription = liveQuery(() =>
      offlineDatabase.specimenDrafts
        .where("ownerId")
        .equals(ownerId)
        .reverse()
        .sortBy("updatedAt"),
    ).subscribe({
      next: setDrafts,
      error: () => setDrafts([]),
    });

    const cacheSubscription = liveQuery(() =>
      offlineDatabase.specimenCache.where("ownerId").equals(ownerId).toArray(),
    ).subscribe({
      next: setCachedSpecimens,
      error: () => setCachedSpecimens([]),
    });

    return () => {
      draftSubscription.unsubscribe();
      cacheSubscription.unsubscribe();
    };
  }, [ownerId]);

  const synchronizeAll = useCallback(async () => {
    if (!navigator.onLine || operationInProgress.current) return;
    operationInProgress.current = true;
    setIsSynchronizing(true);
    try {
      await synchronizeEligibleDrafts(offlineDatabase, ownerId);
      await refreshSpecimenCache(offlineDatabase, ownerId);
    } finally {
      operationInProgress.current = false;
      setIsSynchronizing(false);
    }
  }, [ownerId]);

  useEffect(() => {
    if (!online) return;
    const stableConnectionTimer = window.setTimeout(() => {
      void synchronizeAll();
    }, 2_000);
    return () => window.clearTimeout(stableConnectionTimer);
  }, [online, synchronizeAll]);

  const saveDraft = useCallback(
    async (
      draft: SpecimenDraftData,
      existingClientDraftId?: string,
    ): Promise<OfflineSpecimenDraft> => {
      if (existingClientDraftId) {
        return updateOfflineDraft(
          offlineDatabase,
          ownerId,
          existingClientDraftId,
          draft,
        );
      }
      return createOfflineDraft(offlineDatabase, ownerId, draft);
    },
    [ownerId],
  );

  const retryDraft = useCallback(
    async (clientDraftId: string) => {
      if (!navigator.onLine || operationInProgress.current) return;
      operationInProgress.current = true;
      setIsSynchronizing(true);
      try {
        await synchronizeDraft(offlineDatabase, ownerId, clientDraftId);
        await refreshSpecimenCache(offlineDatabase, ownerId);
      } finally {
        operationInProgress.current = false;
        setIsSynchronizing(false);
      }
    },
    [ownerId],
  );

  const discardDraft = useCallback(
    (clientDraftId: string) =>
      discardOfflineDraft(offlineDatabase, ownerId, clientDraftId),
    [ownerId],
  );

  return {
    cachedSpecimens,
    discardDraft,
    drafts,
    isSynchronizing,
    online,
    retryDraft,
    saveDraft,
    synchronizeAll,
  };
}
