import type { BioSphereOfflineDatabase } from "./database";
import { specimenDraftSchema } from "./schema";
import type {
  CachedSpecimen,
  OfflineSpecimenDraft,
  SpecimenDraftData,
  SpecimenRecord,
} from "./types";

const nowIso = () => new Date().toISOString();

export async function createOfflineDraft(
  database: BioSphereOfflineDatabase,
  ownerId: string,
  draft: SpecimenDraftData,
): Promise<OfflineSpecimenDraft> {
  const timestamp = nowIso();
  const record: OfflineSpecimenDraft = {
    clientDraftId: crypto.randomUUID(),
    ownerId,
    draft: specimenDraftSchema.parse(draft),
    syncState: "PENDING_SYNC",
    createdAt: timestamp,
    updatedAt: timestamp,
    lastAttemptAt: null,
    lastError: null,
    failureKind: null,
    retryable: true,
    serverSpecimenId: null,
    synchronizedAt: null,
  };

  await database.specimenDrafts.add(record);
  return record;
}

export async function updateOfflineDraft(
  database: BioSphereOfflineDatabase,
  ownerId: string,
  clientDraftId: string,
  draft: SpecimenDraftData,
): Promise<OfflineSpecimenDraft> {
  return database.transaction("rw", database.specimenDrafts, async () => {
    const current = await database.specimenDrafts.get(clientDraftId);
    if (!current || current.ownerId !== ownerId) {
      throw new Error("Offline draft not found.");
    }
    if (current.syncState === "SYNCHRONIZING") {
      throw new Error("Wait for synchronization to finish before editing this draft.");
    }
    if (current.syncState === "SYNCHRONIZED") {
      throw new Error("Synchronized records must be edited online.");
    }
    if (current.failureKind === "CONFLICT") {
      throw new Error(
        "This draft ID conflicts with an accepted server record and cannot be edited safely.",
      );
    }

    const updated: OfflineSpecimenDraft = {
      ...current,
      draft: specimenDraftSchema.parse(draft),
      syncState: "PENDING_SYNC",
      updatedAt: nowIso(),
      lastError: null,
      failureKind: null,
      retryable: true,
    };
    await database.specimenDrafts.put(updated);
    return updated;
  });
}

export async function discardOfflineDraft(
  database: BioSphereOfflineDatabase,
  ownerId: string,
  clientDraftId: string,
): Promise<void> {
  await database.transaction("rw", database.specimenDrafts, async () => {
    const current = await database.specimenDrafts.get(clientDraftId);
    if (!current || current.ownerId !== ownerId) return;
    if (current.syncState === "SYNCHRONIZING") {
      throw new Error("Wait for synchronization to finish before discarding this draft.");
    }
    await database.specimenDrafts.delete(clientDraftId);
  });
}

export async function recoverInterruptedSynchronizations(
  database: BioSphereOfflineDatabase,
  ownerId: string,
): Promise<void> {
  const interrupted = await database.specimenDrafts
    .where("[ownerId+syncState]")
    .equals([ownerId, "SYNCHRONIZING"])
    .toArray();

  await database.transaction("rw", database.specimenDrafts, async () => {
    for (const draft of interrupted) {
      await database.specimenDrafts.update(draft.clientDraftId, {
        syncState: "SYNC_FAILED",
        lastError:
          "The previous synchronization was interrupted. It is safe to retry.",
        failureKind: "NETWORK",
        retryable: true,
        updatedAt: nowIso(),
      });
    }
  });
}

export async function replaceCachedSpecimens(
  database: BioSphereOfflineDatabase,
  ownerId: string,
  specimens: SpecimenRecord[],
): Promise<void> {
  const cachedAt = nowIso();
  const records: CachedSpecimen[] = specimens.map((specimen) => ({
    ...specimen,
    ownerId,
    cachedAt,
  }));

  await database.transaction("rw", database.specimenCache, async () => {
    await database.specimenCache.where("ownerId").equals(ownerId).delete();
    await database.specimenCache.bulkPut(records);
  });
}

export async function cacheSynchronizedSpecimen(
  database: BioSphereOfflineDatabase,
  ownerId: string,
  specimen: SpecimenRecord,
): Promise<void> {
  await database.specimenCache.put({
    ...specimen,
    ownerId,
    cachedAt: nowIso(),
  });
}
