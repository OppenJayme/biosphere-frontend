import { z } from "zod";
import type { SpecimenFormValues } from "./form";
import type {
  DuplicateMatchField,
  PossibleDuplicate,
  SpecimenDuplicateCheckResult,
} from "./types";

export const DUPLICATE_FIELD_LABELS: Record<DuplicateMatchField, string> = {
  ACCESSION_NUMBER: "Accession number",
  SCIENTIFIC_NAME: "Scientific name",
  COMMON_NAME: "Common name",
  COLLECTOR: "Collector",
  DONOR: "Donor",
  COLLECTION_LOCATION: "Collection location",
  COLLECTION_DATE: "Collection date",
};

/**
 * Body for POST /specimens/duplicate-check built from the core form. Limits mirror the
 * backend DTO; empty values are omitted because the backend rejects empty strings.
 */
export const duplicateCheckInputSchema = z.object({
  accessionNumber: z.string().trim().min(1).max(100).optional(),
  scientificName: z.string().trim().min(1).max(255).optional(),
  commonName: z.string().trim().min(1).max(255).optional(),
  excludeSpecimenId: z.uuid().optional(),
});

export type DuplicateCheckInput = z.output<typeof duplicateCheckInputSchema>;

/** Returns null when the form has nothing the backend can match on. */
export function duplicateCheckCandidate(
  values: Pick<SpecimenFormValues, "accessionNumber" | "scientificName" | "commonName">,
  excludeSpecimenId?: string,
): DuplicateCheckInput | null {
  const candidate: DuplicateCheckInput = {};
  const accessionNumber = values.accessionNumber.trim();
  const scientificName = values.scientificName.trim();
  const commonName = values.commonName.trim();

  if (accessionNumber) candidate.accessionNumber = accessionNumber;
  if (scientificName) candidate.scientificName = scientificName;
  if (commonName) candidate.commonName = commonName;
  if (Object.keys(candidate).length === 0) return null;

  if (excludeSpecimenId) candidate.excludeSpecimenId = excludeSpecimenId;
  const parsed = duplicateCheckInputSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/**
 * What the curator should be told. "unavailable" is kept distinct from "clear" so a failed
 * lookup is never presented as "no duplicates found".
 */
export type DuplicateCheckOutcome = "clear" | "found" | "unavailable";

export function duplicateCheckOutcome(
  result: Pick<SpecimenDuplicateCheckResult, "duplicateCheckAvailable" | "possibleDuplicates">,
): DuplicateCheckOutcome {
  if (!result.duplicateCheckAvailable) return "unavailable";
  return result.possibleDuplicates.length > 0 ? "found" : "clear";
}

/** Saves after which the specimen page re-checks duplicates with the backend. */
export type DuplicateRecheckTrigger = "created" | "updated" | "provenance";

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Decide whether the specimen page should re-check duplicates. The URL only says that a
 * save just happened; the result always comes from the backend, never from the URL.
 */
export function duplicateRecheckTrigger(
  params: Record<string, SearchParamValue>,
): DuplicateRecheckTrigger | null {
  if (firstValue(params.created) === "1") return "created";
  if (firstValue(params.updated) === "1") return "updated";
  const provenance = firstValue(params.provenance);
  if (provenance === "created" || provenance === "updated") return "provenance";
  return null;
}

export function duplicateLabel(duplicate: PossibleDuplicate) {
  return (
    duplicate.accessionNumber ??
    duplicate.scientificName ??
    duplicate.commonName ??
    "Unnamed specimen"
  );
}

export type DuplicateCheckState =
  | { status: "idle" }
  | { status: "clear" }
  | { status: "found"; duplicates: PossibleDuplicate[] }
  | { status: "unavailable" };
