import { describe, expect, it } from "vitest";
import type { OfflineSpecimenDraft } from "../offline/types";
import { localSyncAlerts, withoutServerReported } from "./local-alerts";

function draft(overrides: Partial<OfflineSpecimenDraft> & { clientDraftId: string }): OfflineSpecimenDraft {
  return {
    ownerId: "owner-1",
    draft: {
      collectionId: null,
      accessionNumber: null,
      specimenCategory: null,
      scientificName: null,
      commonName: null,
      gender: null,
      classificationStatus: null,
      remarks: null,
    },
    syncState: "SYNC_FAILED",
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    lastAttemptAt: null,
    lastError: null,
    failureKind: null,
    retryable: true,
    serverSpecimenId: null,
    synchronizedAt: null,
    ...overrides,
  };
}

describe("device-local sync alerts", () => {
  it("lists only failed drafts, newest attempt first", () => {
    const alerts = localSyncAlerts([
      draft({ clientDraftId: "a", lastAttemptAt: "2026-11-02T00:00:00.000Z" }),
      draft({ clientDraftId: "b", syncState: "PENDING_SYNC" }),
      draft({ clientDraftId: "c", lastAttemptAt: "2026-11-03T00:00:00.000Z" }),
      draft({ clientDraftId: "d", syncState: "SYNCHRONIZED" }),
    ]);
    expect(alerts.map((alert) => alert.id)).toEqual(["LOCAL_SYNC_FAILED:c", "LOCAL_SYNC_FAILED:a"]);
  });

  it("labels a draft by common name, then scientific name, then accession number", () => {
    const base = draft({ clientDraftId: "x" }).draft;
    const [named] = localSyncAlerts([draft({ clientDraftId: "1", draft: { ...base, commonName: " Pitta ", scientificName: "Pitta steerii" } })]);
    const [scientific] = localSyncAlerts([draft({ clientDraftId: "2", draft: { ...base, scientificName: "Pitta steerii" } })]);
    const [accession] = localSyncAlerts([draft({ clientDraftId: "3", draft: { ...base, accessionNumber: "USC-1" } })]);
    const [untitled] = localSyncAlerts([draft({ clientDraftId: "4" })]);
    expect([named.draftLabel, scientific.draftLabel, accession.draftLabel, untitled.draftLabel]).toEqual([
      "Pitta",
      "Pitta steerii",
      "USC-1",
      "Untitled offline draft",
    ]);
  });

  it("hides a local alert the backend already reports as SYNC_FAILED for the same draft", () => {
    const alerts = localSyncAlerts([draft({ clientDraftId: "server-seen" }), draft({ clientDraftId: "offline-only" })]);
    const visible = withoutServerReported(alerts, [
      { type: "SYNC_FAILED", recordId: "server-seen" },
      { type: "NEW_INQUIRY", recordId: "offline-only" },
    ]);
    expect(visible.map((alert) => alert.clientDraftId)).toEqual(["offline-only"]);
  });

  it("carries the stored failure reason and falls back to updatedAt", () => {
    const [alert] = localSyncAlerts([
      draft({ clientDraftId: "r", lastError: "Accession number is already assigned.", updatedAt: "2026-11-04T00:00:00.000Z" }),
    ]);
    expect(alert.reason).toBe("Accession number is already assigned.");
    expect(alert.updatedAt).toBe("2026-11-04T00:00:00.000Z");
  });
});
