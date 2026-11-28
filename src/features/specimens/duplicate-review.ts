/**
 * Presentation rules for the duplicate review page (panel recommendation, 2026-11-28). The
 * backend decides what matches; these only shape how a group is compared and acted on.
 */

import { DUPLICATE_FIELD_LABELS } from "./duplicates";
import type { DuplicateMatchField, DuplicateReviewGroup, DuplicateReviewRecord } from "./types";

type ComparedKey = keyof Pick<
  DuplicateReviewRecord,
  | "accessionNumber"
  | "commonName"
  | "scientificName"
  | "specimenCategory"
  | "collectionName"
  | "collector"
  | "donor"
  | "collectionLocation"
  | "collectionDate"
>;

/** Rows of the comparison table, in record-form order, with the match field each one shows. */
export const DUPLICATE_REVIEW_ROWS: { key: ComparedKey; label: string; field?: DuplicateMatchField }[] = [
  { key: "accessionNumber", label: "Accession number", field: "ACCESSION_NUMBER" },
  { key: "commonName", label: "Common name", field: "COMMON_NAME" },
  { key: "scientificName", label: "Scientific name", field: "SCIENTIFIC_NAME" },
  { key: "specimenCategory", label: "Category" },
  { key: "collectionName", label: "Collection" },
  { key: "collector", label: "Collector", field: "COLLECTOR" },
  { key: "donor", label: "Donor", field: "DONOR" },
  { key: "collectionLocation", label: "Collection location", field: "COLLECTION_LOCATION" },
  { key: "collectionDate", label: "Collection date", field: "COLLECTION_DATE" },
];

/** Fields that matched in at least one pair of the group, to highlight in the table. */
export function matchedFieldsInGroup(group: DuplicateReviewGroup) {
  return new Set(group.matches.flatMap((match) => match.matchedFields));
}

export function reviewRecordLabel(record: Pick<DuplicateReviewRecord, "accessionNumber" | "commonName" | "scientificName">) {
  return record.accessionNumber ?? record.commonName ?? record.scientificName ?? "Unnamed specimen";
}

/** One readable line per matching pair: who, how sure, what matched and what differs. */
export function describeReviewMatch(group: DuplicateReviewGroup, match: DuplicateReviewGroup["matches"][number]) {
  const byId = new Map(group.records.map((record) => [record.specimenId, record]));
  const first = byId.get(match.firstSpecimenId);
  const second = byId.get(match.secondSpecimenId);
  const names = (fields: DuplicateMatchField[]) =>
    fields.map((field) => DUPLICATE_FIELD_LABELS[field].toLowerCase()).join(", ");
  return {
    pair: `${first ? reviewRecordLabel(first) : "Record"} and ${second ? reviewRecordLabel(second) : "record"}`,
    confidence: match.confidence === "HIGH" ? "High confidence" : "Medium confidence",
    matched: match.matchedFields.length > 0 ? `Same ${names(match.matchedFields)}` : null,
    differing: match.differingFields.length > 0 ? `Differs in ${names(match.differingFields)}` : null,
  };
}

/**
 * Where Edit goes. An Uncataloged record is finished on the one-page form; a Cataloged one keeps
 * its own editors. Provenance edits are for verified corrections, never to silence a warning.
 */
export function reviewEditHrefs(record: Pick<DuplicateReviewRecord, "specimenId" | "status">) {
  const base = `/specimens/${record.specimenId}`;
  return record.status === "UNCATALOGED"
    ? { details: `${base}/complete`, provenance: `${base}/complete#section-provenance` }
    : { details: `${base}/edit`, provenance: `${base}/provenance` };
}
