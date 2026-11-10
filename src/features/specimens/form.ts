import { z } from "zod";
import { SPECIMEN_GENDERS, type SpecimenSummary } from "./types";

export const SPECIMEN_FORM_FIELDS = [
  "collectionId",
  "accessionNumber",
  "specimenCategory",
  "scientificName",
  "commonName",
  "gender",
  "classificationStatus",
  "remarks",
] as const;

export type SpecimenFormField = (typeof SPECIMEN_FORM_FIELDS)[number];
export type SpecimenFormValues = Record<SpecimenFormField, string>;

export type SpecimenFormState = {
  values: SpecimenFormValues;
  errors?: Partial<Record<SpecimenFormField, string[]>>;
  message?: string;
};

export const EMPTY_SPECIMEN_FORM_VALUES: SpecimenFormValues = {
  collectionId: "",
  accessionNumber: "",
  specimenCategory: "",
  scientificName: "",
  commonName: "",
  gender: "",
  classificationStatus: "",
  remarks: "",
};

const nullableUuid = z
  .string()
  .trim()
  .refine((value) => value === "" || z.uuid().safeParse(value).success, {
    message: "Select a valid collection.",
  })
  .transform((value) => value || null);

function nullableText(maxLength?: number) {
  const text = z.string().trim();
  const constrained = maxLength
    ? text.max(maxLength, `Must be ${maxLength} characters or fewer.`)
    : text;

  return constrained.transform((value) => value || null);
}

const nullableGender = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || SPECIMEN_GENDERS.includes(value as (typeof SPECIMEN_GENDERS)[number]),
    { message: "Select a valid gender value." },
  )
  .transform((value) => (value === "" ? null : (value as (typeof SPECIMEN_GENDERS)[number])));

export const specimenFormSchema = z.object({
  collectionId: nullableUuid,
  accessionNumber: nullableText(100),
  specimenCategory: nullableText(100),
  scientificName: nullableText(255),
  commonName: nullableText(255),
  gender: nullableGender,
  classificationStatus: nullableText(),
  remarks: nullableText(),
});

export type SpecimenMutationInput = z.output<typeof specimenFormSchema>;

function formString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export function readSpecimenForm(formData: FormData) {
  const values = Object.fromEntries(
    SPECIMEN_FORM_FIELDS.map((field) => [field, formString(formData.get(field))]),
  ) as SpecimenFormValues;

  return {
    values,
    result: specimenFormSchema.safeParse(values),
  };
}

export function specimenToFormValues(specimen: SpecimenSummary): SpecimenFormValues {
  return {
    collectionId: specimen.collectionId ?? "",
    accessionNumber: specimen.accessionNumber ?? "",
    specimenCategory: specimen.specimenCategory ?? "",
    scientificName: specimen.scientificName ?? "",
    commonName: specimen.commonName ?? "",
    gender: specimen.gender ?? "",
    classificationStatus: specimen.classificationStatus ?? "",
    remarks: specimen.remarks ?? "",
  };
}
