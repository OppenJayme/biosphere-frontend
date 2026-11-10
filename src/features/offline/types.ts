export const SYNC_STATES = [
  "PENDING_SYNC",
  "SYNCHRONIZING",
  "SYNCHRONIZED",
  "SYNC_FAILED",
] as const;

export type SyncState = (typeof SYNC_STATES)[number];

export const SPECIMEN_GENDERS = [
  "MALE",
  "FEMALE",
  "UNKNOWN",
  "NOT_APPLICABLE",
] as const;

export type SpecimenGender = (typeof SPECIMEN_GENDERS)[number];

export type SpecimenDraftData = {
  collectionId: string | null;
  accessionNumber: string | null;
  specimenCategory: string | null;
  scientificName: string | null;
  commonName: string | null;
  gender: SpecimenGender | null;
  classificationStatus: string | null;
  remarks: string | null;
};

export type SpecimenRecord = SpecimenDraftData & {
  id: string;
  status: "UNCATALOGED" | "CATALOGED" | "ARCHIVED";
  publicDisplay: boolean;
  createdBy: string;
  updatedBy: string | null;
  archivedBy: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SyncFailureKind =
  | "AUTH"
  | "CONFLICT"
  | "NETWORK"
  | "SERVER"
  | "VALIDATION"
  | "UNKNOWN";

export type OfflineSpecimenDraft = {
  clientDraftId: string;
  ownerId: string;
  draft: SpecimenDraftData;
  syncState: SyncState;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt: string | null;
  lastError: string | null;
  failureKind: SyncFailureKind | null;
  retryable: boolean;
  serverSpecimenId: string | null;
  synchronizedAt: string | null;
};

export type CachedSpecimen = SpecimenRecord & {
  ownerId: string;
  cachedAt: string;
};

export type SyncSpecimenDraftResult = {
  clientDraftId: string;
  alreadySynchronized: boolean;
  specimen: SpecimenRecord;
};
