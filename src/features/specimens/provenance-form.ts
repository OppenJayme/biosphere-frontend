import { z } from "zod";
import type { SpecimenProvenance } from "./types";

export const PROVENANCE_FORM_FIELDS = [
  "collector",
  "donor",
  "collectionDate",
  "collectionLocation",
  "preservationType",
  "preservationMethod",
] as const;

export type ProvenanceFormField = (typeof PROVENANCE_FORM_FIELDS)[number];
export type ProvenanceFormValues = Record<ProvenanceFormField, string>;
export type ProvenanceFormMode = "create" | "update";

export type ProvenanceFormState = {
  values: ProvenanceFormValues;
  errors?: Partial<Record<ProvenanceFormField, string[]>>;
  message?: string;
};

export const EMPTY_PROVENANCE_FORM_VALUES: ProvenanceFormValues = {
  collector: "",
  donor: "",
  collectionDate: "",
  collectionLocation: "",
  preservationType: "",
  preservationMethod: "",
};

const nullableText = z
  .string()
  .trim()
  .max(255, "Must be 255 characters or fewer.")
  .transform((value) => value || null);

const nullableDate = z
  .string()
  .trim()
  .refine((value) => value === "" || z.iso.date().safeParse(value).success, {
    message: "Enter a valid date in YYYY-MM-DD format.",
  })
  .transform((value) => value || null);

export const provenanceFormSchema = z.object({
  collector: nullableText,
  donor: nullableText,
  collectionDate: nullableDate,
  collectionLocation: nullableText,
  preservationType: nullableText,
  preservationMethod: nullableText,
});

const provenanceCreateFormSchema = provenanceFormSchema.refine(
  (provenance) => Object.values(provenance).some((value) => value !== null),
  { message: "Enter at least one provenance or preservation value before creating the record." },
);

export type ProvenanceMutationInput = z.output<typeof provenanceFormSchema>;

function formString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export function readProvenanceForm(formData: FormData, mode: ProvenanceFormMode) {
  const values = Object.fromEntries(
    PROVENANCE_FORM_FIELDS.map((field) => [field, formString(formData.get(field))]),
  ) as ProvenanceFormValues;
  const schema = mode === "create" ? provenanceCreateFormSchema : provenanceFormSchema;

  return { values, result: schema.safeParse(values) };
}

export function provenanceToFormValues(
  provenance: SpecimenProvenance | null,
): ProvenanceFormValues {
  if (!provenance) return { ...EMPTY_PROVENANCE_FORM_VALUES };

  return {
    collector: provenance.collector ?? "",
    donor: provenance.donor ?? "",
    collectionDate: provenance.collectionDate ?? "",
    collectionLocation: provenance.collectionLocation ?? "",
    preservationType: provenance.preservationType ?? "",
    preservationMethod: provenance.preservationMethod ?? "",
  };
}
