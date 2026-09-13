import Dexie, { type EntityTable } from "dexie";
import type { CachedSpecimen, OfflineSpecimenDraft } from "./types";

export class BioSphereOfflineDatabase extends Dexie {
  specimenDrafts!: EntityTable<OfflineSpecimenDraft, "clientDraftId">;
  specimenCache!: EntityTable<CachedSpecimen, "id">;

  constructor(name = "biosphere-offline") {
    super(name);

    this.version(1).stores({
      specimenDrafts:
        "clientDraftId, ownerId, syncState, updatedAt, [ownerId+syncState]",
      specimenCache: "[ownerId+id], ownerId, status, updatedAt, cachedAt",
    });
  }
}

export const offlineDatabase = new BioSphereOfflineDatabase();
