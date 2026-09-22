import { z } from "zod";

const POSTGRES_INTEGER_MAX = 2_147_483_647;

export const CREATE_LOT_FORM_FIELDS = [
  "storageUnitId",
  "conditionClass",
  "quantity",
  "storageNotes",
  "reason",
] as const;

export type CreateLotFormField = (typeof CREATE_LOT_FORM_FIELDS)[number];
export type CreateLotFormValues = Record<CreateLotFormField, string>;

export type CreateLotFormState = {
  values: CreateLotFormValues;
  errors?: Partial<Record<CreateLotFormField, string[]>>;
  message?: string;
};

export const EMPTY_CREATE_LOT_FORM_VALUES: CreateLotFormValues = {
  storageUnitId: "",
  conditionClass: "",
  quantity: "1",
  storageNotes: "",
  reason: "",
};

const positivePostgresInteger = z
  .string()
  .trim()
  .regex(/^\d+$/, "Enter a whole number greater than zero.")
  .transform(Number)
  .pipe(
    z
      .number()
      .int()
      .min(1, "Quantity must be at least 1.")
      .max(POSTGRES_INTEGER_MAX, `Quantity cannot exceed ${POSTGRES_INTEGER_MAX}.`),
  );

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

export const createSpecimenLotFormSchema = z.object({
  storageUnitId: z.uuid("Select a valid storage location."),
  conditionClass: z.string().trim().min(1, "Enter the specimen condition."),
  quantity: positivePostgresInteger,
  storageNotes: optionalText,
  reason: optionalText,
});

export type CreateSpecimenLotInput = z.output<typeof createSpecimenLotFormSchema>;

function formString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

export function readCreateSpecimenLotForm(formData: FormData) {
  const values = Object.fromEntries(
    CREATE_LOT_FORM_FIELDS.map((field) => [field, formString(formData.get(field))]),
  ) as CreateLotFormValues;

  return {
    values,
    result: createSpecimenLotFormSchema.safeParse(values),
  };
}
