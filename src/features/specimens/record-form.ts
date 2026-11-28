/**
 * The one-page catalog form (panel recommendation, 2026-11-28): every section of a specimen
 * record on one page, saved in one request. Each section is read with its own form's parser,
 * so validation matches the separate edit pages. The checklist mirrors the backend's
 * CATALOG_REQUIREMENTS for live feedback only; the backend re-checks every rule when saving.
 */
import { z } from "zod";
import { museumToday } from "../../lib/museum-date";
import {
  createSpecimenLotFormSchema,
  type CreateSpecimenLotInput,
} from "../specimen-lots/form";
import { SPECIMEN_FORM_FIELDS, readSpecimenForm, type SpecimenMutationInput } from "./form";
import {
  PROVENANCE_FORM_FIELDS,
  readProvenanceForm,
  type ProvenanceMutationInput,
} from "./provenance-form";
import {
  TAXONOMY_FORM_FIELDS,
  readTaxonomyForm,
  type TaxonomyMutationInput,
} from "./taxonomy-form";

export const RECORD_LOT_FIELDS = ["storageUnitId", "conditionClass", "quantity", "storageNotes"] as const;

export const RECORD_FORM_FIELDS = [
  ...SPECIMEN_FORM_FIELDS,
  ...TAXONOMY_FORM_FIELDS,
  ...PROVENANCE_FORM_FIELDS,
  ...RECORD_LOT_FIELDS,
] as const;

export type RecordFormField = (typeof RECORD_FORM_FIELDS)[number];
export type RecordFormValues = Record<RecordFormField, string>;

export const EMPTY_RECORD_FORM_VALUES = Object.fromEntries(
  RECORD_FORM_FIELDS.map((field) => [field, field === "quantity" ? "1" : ""]),
) as RecordFormValues;

export type RecordSection = "basic" | "taxonomy" | "provenance" | "storage";

export const RECORD_SECTION_LABELS: Record<RecordSection, string> = {
  basic: "Basic details",
  taxonomy: "Taxonomy",
  provenance: "Provenance and preservation",
  storage: "Storage and quantity",
};

/** What the page knows about the record being completed. */
export type RecordContext = {
  mode: "create" | "complete";
  /** The record already has an active lot, so the storage section adds none. */
  hasActiveLot: boolean;
};

export type RecordCheck = {
  key: string;
  label: string;
  section: RecordSection;
  passed: boolean;
  /** Shown instead of a failure, e.g. an accession number assigned on save. */
  note?: string;
};

function text(values: Partial<RecordFormValues>, field: RecordFormField) {
  return (values[field] ?? "").trim();
}

function validCollectionDate(value: string) {
  return z.iso.date().safeParse(value).success && value <= museumToday();
}

function lotStarted(values: Partial<RecordFormValues>) {
  return Boolean(text(values, "storageUnitId") || text(values, "conditionClass"));
}

function lotComplete(values: Partial<RecordFormValues>) {
  return (
    Boolean(text(values, "storageUnitId")) &&
    Boolean(text(values, "conditionClass")) &&
    /^\d+$/.test(text(values, "quantity")) &&
    Number(text(values, "quantity")) >= 1
  );
}

/** The catalog requirements, in the backend's order and wording, judged from the form values. */
export function recordChecklist(values: Partial<RecordFormValues>, context: RecordContext): RecordCheck[] {
  const accession = text(values, "accessionNumber");
  return [
    { key: "collection", label: "Collection is assigned", section: "basic", passed: Boolean(text(values, "collectionId")) },
    {
      key: "accessionNumber",
      label: "Accession number is assigned",
      section: "basic",
      passed: Boolean(accession) || context.mode === "create",
      note: !accession && context.mode === "create" ? "Assigned automatically when you save" : undefined,
    },
    { key: "commonName", label: "Common name is recorded", section: "basic", passed: Boolean(text(values, "commonName")) },
    { key: "kingdom", label: "Taxonomic kingdom is recorded", section: "taxonomy", passed: Boolean(text(values, "kingdom")) },
    {
      key: "collectionDate",
      label: "A valid collection date on or before today is recorded",
      section: "provenance",
      passed: validCollectionDate(text(values, "collectionDate")),
    },
    {
      key: "preservationType",
      label: "Preservation type is recorded",
      section: "provenance",
      passed: Boolean(text(values, "preservationType")),
    },
    {
      key: "preservationMethod",
      label: "Preservation method is recorded",
      section: "provenance",
      passed: Boolean(text(values, "preservationMethod")),
    },
    {
      key: "activeLot",
      label: "An active lot has positive quantity in a specimen-holding storage location",
      section: "storage",
      passed: context.hasActiveLot || lotComplete(values),
    },
  ];
}

export type SpecimenRecordInput = {
  specimen: Partial<SpecimenMutationInput>;
  taxonomy: TaxonomyMutationInput;
  provenance: ProvenanceMutationInput;
  lot?: CreateSpecimenLotInput;
};

export type RecordFormErrors = Partial<Record<RecordFormField, string[]>>;

function formString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export function readRecordFormValues(formData: FormData): RecordFormValues {
  return Object.fromEntries(
    RECORD_FORM_FIELDS.map((field) => [field, formString(formData.get(field))]),
  ) as RecordFormValues;
}

/**
 * Parses every section. The storage section is optional: left blank, no lot is created; partly
 * filled, it must be completed. A blank accession number is left out when completing a draft, so
 * an existing number is never cleared and the backend's rule stays the only one that decides.
 */
export function readSpecimenRecordForm(
  formData: FormData,
  context: RecordContext,
): { values: RecordFormValues; errors?: RecordFormErrors; input?: SpecimenRecordInput } {
  const values = readRecordFormValues(formData);
  const specimen = readSpecimenForm(formData);
  const taxonomy = readTaxonomyForm(formData, "update");
  const provenance = readProvenanceForm(formData, "update");
  const wantsLot = !context.hasActiveLot && lotStarted(values);
  const lot = wantsLot
    ? createSpecimenLotFormSchema.safeParse({ ...values, reason: "" })
    : undefined;

  const errors: RecordFormErrors = {
    ...(specimen.result.success ? {} : specimen.result.error.flatten().fieldErrors),
    ...(taxonomy.result.success ? {} : taxonomy.result.error.flatten().fieldErrors),
    ...(provenance.result.success ? {} : provenance.result.error.flatten().fieldErrors),
    ...(lot && !lot.success ? lot.error.flatten().fieldErrors : {}),
  };
  if (!specimen.result.success || !taxonomy.result.success || !provenance.result.success || (lot && !lot.success)) {
    return { values, errors };
  }

  const core: Partial<SpecimenMutationInput> = { ...specimen.result.data };
  if (context.mode === "complete" && core.accessionNumber === null) delete core.accessionNumber;
  return {
    values,
    input: {
      specimen: core,
      taxonomy: taxonomy.result.data,
      provenance: provenance.result.data,
      lot: lot?.success ? { ...lot.data, reason: null } : undefined,
    },
  };
}

/** Values the form fills in from the curator's last specimen on this device. */
export const REMEMBERED_FIELDS = ["collectionId", "storageUnitId", "preservationType", "preservationMethod"] as const;
export type RememberedField = (typeof REMEMBERED_FIELDS)[number];
export const REMEMBERED_STORAGE_KEY = "biosphere.catalogForm.lastUsed.v1";

/** Applies remembered values to blank fields only, and only those that are still valid choices. */
export function applyRemembered(
  values: RecordFormValues,
  remembered: Partial<Record<RememberedField, string>>,
  validChoices: { collectionIds: ReadonlySet<string>; storageUnitIds: ReadonlySet<string> },
): { values: RecordFormValues; applied: RememberedField[] } {
  const next = { ...values };
  const applied: RememberedField[] = [];
  for (const field of REMEMBERED_FIELDS) {
    const value = (remembered[field] ?? "").trim();
    if (!value || next[field].trim()) continue;
    if (field === "collectionId" && !validChoices.collectionIds.has(value)) continue;
    if (field === "storageUnitId" && !validChoices.storageUnitIds.has(value)) continue;
    next[field] = value;
    applied.push(field);
  }
  return { values: next, applied };
}
