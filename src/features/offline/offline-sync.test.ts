import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BioSphereOfflineDatabase } from "./database";
import {
  createOfflineDraft,
  recoverInterruptedSynchronizations,
  updateOfflineDraft,
} from "./store";
import {
  refreshSpecimenCache,
  synchronizeDraft,
} from "./sync";
import type { SpecimenDraftData, SpecimenRecord } from "./types";

const OWNER_ID = "10000000-0000-4000-8000-000000000001";
const OTHER_OWNER_ID = "10000000-0000-4000-8000-000000000002";
const SPECIMEN_ID = "20000000-0000-4000-8000-000000000001";

const draftData: SpecimenDraftData = {
  collectionId: null,
  accessionNumber: "USCBM-OFFLINE-001",
  specimenCategory: "Reptile",
  scientificName: "Python regius",
  commonName: "Ball Python",
  gender: "UNKNOWN",
  classificationStatus: null,
  remarks: "Created while offline",
};

const specimen: SpecimenRecord = {
  ...draftData,
  id: SPECIMEN_ID,
  status: "UNCATALOGED",
  publicDisplay: false,
  createdBy: OWNER_ID,
  updatedBy: null,
  archivedBy: null,
  archivedAt: null,
  createdAt: "2026-09-14T00:00:00.000Z",
  updatedAt: "2026-09-14T00:00:00.000Z",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("offline specimen synchronization", () => {
  let database: BioSphereOfflineDatabase;

  beforeEach(() => {
    database = new BioSphereOfflineDatabase(`biosphere-test-${crypto.randomUUID()}`);
  });

  afterEach(async () => {
    await database.delete();
  });

  it("creates a stable pending draft and isolates it by owner", async () => {
    const created = await createOfflineDraft(database, OWNER_ID, draftData);

    expect(created.clientDraftId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(created.syncState).toBe("PENDING_SYNC");
    expect(
      await database.specimenDrafts.where("ownerId").equals(OWNER_ID).count(),
    ).toBe(1);
    expect(
      await database.specimenDrafts.where("ownerId").equals(OTHER_OWNER_ID).count(),
    ).toBe(0);
  });

  it("sends the stable ID once and atomically stores the accepted specimen", async () => {
    const created = await createOfflineDraft(database, OWNER_ID, draftData);
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
      expect(init?.method).toBe("POST");
      expect(JSON.parse(String(init?.body))).toEqual({
        clientDraftId: created.clientDraftId,
        draft: draftData,
      });
      return jsonResponse({
        clientDraftId: created.clientDraftId,
        alreadySynchronized: false,
        specimen,
      });
    });

    const result = await synchronizeDraft(
      database,
      OWNER_ID,
      created.clientDraftId,
      fetcher,
    );

    expect(result?.specimen.id).toBe(SPECIMEN_ID);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect((await database.specimenDrafts.get(created.clientDraftId))?.syncState).toBe(
      "SYNCHRONIZED",
    );
    expect(
      await database.specimenCache.get([OWNER_ID, SPECIMEN_ID]),
    ).toMatchObject({ id: SPECIMEN_ID, ownerId: OWNER_ID });
  });

  it("prevents concurrent attempts from sending the same local draft twice", async () => {
    const created = await createOfflineDraft(database, OWNER_ID, draftData);
    const fetcher = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        clientDraftId: created.clientDraftId,
        alreadySynchronized: false,
        specimen,
      }),
    );

    await Promise.all([
      synchronizeDraft(database, OWNER_ID, created.clientDraftId, fetcher),
      synchronizeDraft(database, OWNER_ID, created.clientDraftId, fetcher),
    ]);

    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("retains a network failure for a safe retry", async () => {
    const created = await createOfflineDraft(database, OWNER_ID, draftData);
    const fetcher = vi.fn<typeof fetch>(async () => {
      throw new TypeError("network unavailable");
    });

    await synchronizeDraft(database, OWNER_ID, created.clientDraftId, fetcher);

    const failed = await database.specimenDrafts.get(created.clientDraftId);
    expect(failed).toMatchObject({
      syncState: "SYNC_FAILED",
      failureKind: "NETWORK",
      retryable: true,
      serverSpecimenId: null,
    });
    expect(failed?.lastError).toContain("still saved locally");
  });

  it("locks an ID-reuse conflict against unsafe retry or editing", async () => {
    const created = await createOfflineDraft(database, OWNER_ID, draftData);
    const fetcher = vi.fn<typeof fetch>(async () =>
      jsonResponse(
        {
          message:
            "This offline draft ID was already synchronized with different content.",
        },
        409,
      ),
    );

    await synchronizeDraft(database, OWNER_ID, created.clientDraftId, fetcher);

    expect(await database.specimenDrafts.get(created.clientDraftId)).toMatchObject({
      syncState: "SYNC_FAILED",
      failureKind: "CONFLICT",
      retryable: false,
    });
    await expect(
      updateOfflineDraft(database, OWNER_ID, created.clientDraftId, {
        ...draftData,
        remarks: "Changed",
      }),
    ).rejects.toThrow("cannot be edited safely");
  });

  it("recovers an interrupted request because the backend retry is idempotent", async () => {
    const created = await createOfflineDraft(database, OWNER_ID, draftData);
    await database.specimenDrafts.update(created.clientDraftId, {
      syncState: "SYNCHRONIZING",
    });

    await recoverInterruptedSynchronizations(database, OWNER_ID);

    expect(await database.specimenDrafts.get(created.clientDraftId)).toMatchObject({
      syncState: "SYNC_FAILED",
      failureKind: "NETWORK",
      retryable: true,
    });
  });

  it("refreshes one curator's cache without exposing or deleting another's", async () => {
    await database.specimenCache.put({
      ...specimen,
      ownerId: OTHER_OWNER_ID,
      cachedAt: "2026-09-14T00:00:00.000Z",
    });
    const fetcher = vi.fn<typeof fetch>(async () => jsonResponse([specimen]));

    expect(await refreshSpecimenCache(database, OWNER_ID, fetcher)).toBe(true);
    expect(await database.specimenCache.get([OWNER_ID, SPECIMEN_ID])).toBeDefined();
    expect(
      await database.specimenCache.get([OTHER_OWNER_ID, SPECIMEN_ID]),
    ).toBeDefined();
  });
});
