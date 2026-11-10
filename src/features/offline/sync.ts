import type { BioSphereOfflineDatabase } from "./database";
import {
  specimenListSchema,
  syncSpecimenDraftResultSchema,
} from "./schema";
import { cacheSynchronizedSpecimen, replaceCachedSpecimens } from "./store";
import type {
  OfflineSpecimenDraft,
  SyncFailureKind,
  SyncSpecimenDraftResult,
} from "./types";

type Fetcher = typeof fetch;

type SyncFailure = {
  kind: SyncFailureKind;
  message: string;
  retryable: boolean;
};

const nowIso = () => new Date().toISOString();

function safeResponseMessage(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("message" in body)) return null;
  const message = body.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message) && message.every((item) => typeof item === "string")) {
    return message.join(" ");
  }
  return null;
}

async function classifyFailure(response: Response): Promise<SyncFailure> {
  const body = await response.json().catch(() => null);
  const serverMessage = safeResponseMessage(body);

  if (response.status === 400) {
    return {
      kind: "VALIDATION",
      message: serverMessage ?? "Review the draft fields before trying again.",
      retryable: false,
    };
  }
  if (response.status === 401) {
    return {
      kind: "AUTH",
      message: "Your session expired. Sign in again, then retry this draft.",
      retryable: true,
    };
  }
  if (response.status === 403) {
    return {
      kind: "AUTH",
      message: "Your account is not allowed to synchronize specimen drafts.",
      retryable: false,
    };
  }
  if (response.status === 409) {
    return {
      kind: "CONFLICT",
      message:
        serverMessage ??
        "This draft ID conflicts with a specimen already accepted by the server.",
      retryable: false,
    };
  }
  if (response.status === 429 || response.status >= 500) {
    return {
      kind: "SERVER",
      message: "The server is temporarily unavailable. Your draft is still saved locally.",
      retryable: true,
    };
  }

  return {
    kind: "UNKNOWN",
    message: "The draft could not be synchronized. Your local copy was preserved.",
    retryable: false,
  };
}

async function claimDraft(
  database: BioSphereOfflineDatabase,
  ownerId: string,
  clientDraftId: string,
): Promise<OfflineSpecimenDraft | null> {
  return database.transaction("rw", database.specimenDrafts, async () => {
    const current = await database.specimenDrafts.get(clientDraftId);
    if (!current || current.ownerId !== ownerId) return null;
    if (
      current.syncState === "SYNCHRONIZED" ||
      current.syncState === "SYNCHRONIZING"
    ) {
      return null;
    }

    const claimed: OfflineSpecimenDraft = {
      ...current,
      syncState: "SYNCHRONIZING",
      lastAttemptAt: nowIso(),
      lastError: null,
      failureKind: null,
      updatedAt: nowIso(),
    };
    await database.specimenDrafts.put(claimed);
    return claimed;
  });
}

async function recordFailure(
  database: BioSphereOfflineDatabase,
  ownerId: string,
  clientDraftId: string,
  failure: SyncFailure,
): Promise<void> {
  await database.transaction("rw", database.specimenDrafts, async () => {
    const current = await database.specimenDrafts.get(clientDraftId);
    if (
      !current ||
      current.ownerId !== ownerId ||
      current.syncState !== "SYNCHRONIZING"
    ) {
      return;
    }
    await database.specimenDrafts.update(clientDraftId, {
      syncState: "SYNC_FAILED",
      lastError: failure.message,
      failureKind: failure.kind,
      retryable: failure.retryable,
      updatedAt: nowIso(),
    });
  });
}

export async function synchronizeDraft(
  database: BioSphereOfflineDatabase,
  ownerId: string,
  clientDraftId: string,
  fetcher: Fetcher = fetch,
): Promise<SyncSpecimenDraftResult | null> {
  const claimed = await claimDraft(database, ownerId, clientDraftId);
  if (!claimed) return null;

  try {
    const response = await fetcher("/api/offline/specimen-drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientDraftId: claimed.clientDraftId,
        draft: claimed.draft,
      }),
    });

    if (!response.ok) {
      await recordFailure(
        database,
        ownerId,
        clientDraftId,
        await classifyFailure(response),
      );
      return null;
    }

    const result = syncSpecimenDraftResultSchema.parse(await response.json());
    if (result.clientDraftId !== clientDraftId) {
      throw new Error("The server returned a mismatched draft identifier.");
    }

    await database.transaction(
      "rw",
      database.specimenDrafts,
      database.specimenCache,
      async () => {
        const current = await database.specimenDrafts.get(clientDraftId);
        if (
          !current ||
          current.ownerId !== ownerId ||
          current.syncState !== "SYNCHRONIZING"
        ) {
          throw new Error("The local draft changed while it was synchronizing.");
        }

        await database.specimenDrafts.update(clientDraftId, {
          syncState: "SYNCHRONIZED",
          serverSpecimenId: result.specimen.id,
          synchronizedAt: nowIso(),
          lastError: null,
          failureKind: null,
          retryable: false,
          updatedAt: nowIso(),
        });
        await cacheSynchronizedSpecimen(database, ownerId, result.specimen);
      },
    );

    return result;
  } catch (error) {
    const isNetworkFailure = error instanceof TypeError;
    await recordFailure(database, ownerId, clientDraftId, {
      kind: isNetworkFailure ? "NETWORK" : "UNKNOWN",
      message: isNetworkFailure
        ? "Connection lost during synchronization. Your draft is still saved locally."
        : "The synchronization response was invalid. Your draft is still saved locally.",
      retryable: isNetworkFailure,
    });
    return null;
  }
}

export async function synchronizeEligibleDrafts(
  database: BioSphereOfflineDatabase,
  ownerId: string,
  fetcher: Fetcher = fetch,
): Promise<void> {
  const drafts = await database.specimenDrafts.where("ownerId").equals(ownerId).toArray();
  const eligible = drafts
    .filter(
      (draft) =>
        draft.syncState === "PENDING_SYNC" ||
        (draft.syncState === "SYNC_FAILED" && draft.retryable),
    )
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  for (const draft of eligible) {
    await synchronizeDraft(database, ownerId, draft.clientDraftId, fetcher);
  }
}

export async function refreshSpecimenCache(
  database: BioSphereOfflineDatabase,
  ownerId: string,
  fetcher: Fetcher = fetch,
): Promise<boolean> {
  try {
    const response = await fetcher("/api/offline/specimens", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return false;
    const specimens = specimenListSchema.parse(await response.json());
    await replaceCachedSpecimens(database, ownerId, specimens);
    return true;
  } catch {
    return false;
  }
}
