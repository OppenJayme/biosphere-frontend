import { z } from "zod";
import type { SpecimenTaxonomy } from "./types";

export const TAXONOMY_FORM_FIELDS = [
  "kingdom",
  "phylum",
  "class",
  "orderName",
  "family",
  "genus",
  "species",
  "habitat",
  "ecologicalRole",
  "conservationStatus",
] as const;

export type TaxonomyFormField = (typeof TAXONOMY_FORM_FIELDS)[number];
export type TaxonomyFormValues = Record<TaxonomyFormField, string>;
export type TaxonomyFormMode = "create" | "update";

export type TaxonomyFormState = {
  values: TaxonomyFormValues;
  errors?: Partial<Record<TaxonomyFormField, string[]>>;
  message?: string;
};

export const EMPTY_TAXONOMY_FORM_VALUES: TaxonomyFormValues = {
  kingdom: "",
  phylum: "",
  class: "",
  orderName: "",
  family: "",
  genus: "",
  species: "",
  habitat: "",
  ecologicalRole: "",
  conservationStatus: "",
};

function nullableText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `Must be ${maxLength} characters or fewer.`)
    .transform((value) => value || null);
}

export const taxonomyFormSchema = z.object({
  kingdom: nullableText(100),
  phylum: nullableText(100),
  class: nullableText(100),
  orderName: nullableText(100),
  family: nullableText(100),
  genus: nullableText(100),
  species: nullableText(100),
  habitat: nullableText(250),
  ecologicalRole: nullableText(100),
  conservationStatus: nullableText(100),
});

const taxonomyCreateFormSchema = taxonomyFormSchema.refine(
  (taxonomy) => Object.values(taxonomy).some((value) => value !== null),
  { message: "Enter at least one taxonomy value before creating the record." },
);

export type TaxonomyMutationInput = z.output<typeof taxonomyFormSchema>;

function formString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export function readTaxonomyForm(formData: FormData, mode: TaxonomyFormMode) {
  const values = Object.fromEntries(
    TAXONOMY_FORM_FIELDS.map((field) => [field, formString(formData.get(field))]),
  ) as TaxonomyFormValues;
  const schema = mode === "create" ? taxonomyCreateFormSchema : taxonomyFormSchema;

  return { values, result: schema.safeParse(values) };
}

export function taxonomyToFormValues(
  taxonomy: SpecimenTaxonomy | null,
): TaxonomyFormValues {
  if (!taxonomy) return { ...EMPTY_TAXONOMY_FORM_VALUES };

  return {
    kingdom: taxonomy.kingdom ?? "",
    phylum: taxonomy.phylum ?? "",
    class: taxonomy.class ?? "",
    orderName: taxonomy.orderName ?? "",
    family: taxonomy.family ?? "",
    genus: taxonomy.genus ?? "",
    species: taxonomy.species ?? "",
    habitat: taxonomy.habitat ?? "",
    ecologicalRole: taxonomy.ecologicalRole ?? "",
    conservationStatus: taxonomy.conservationStatus ?? "",
  };
}
