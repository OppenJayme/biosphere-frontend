/** Form validation for storage management without freezing curator-extensible values. */

import { z } from "zod";

const requiredText = (message: string) => z.string().trim().min(1, message);
const optionalText = z.string().trim().transform((value) => value || null);
const optionalId = z.string().trim().transform((value) => value || null).pipe(z.uuid().nullable());
const optionalCapacity = z
  .string()
  .trim()
  .refine((value) => value === "" || /^\d+$/.test(value), "Capacity must be a whole number.")
  .transform((value) => (value === "" ? null : Number(value)))
  .refine(
    (value) => value === null || (Number.isSafeInteger(value) && value >= 1 && value <= 2_147_483_647),
    "Capacity must be between 1 and 2,147,483,647.",
  );

export const storageLocationMutationSchema = z.object({
  label: requiredText("Enter a location label."),
  unitType: requiredText("Enter a unit type."),
  storageType: requiredText("Enter a storage type."),
  size: optionalText,
  parentId: optionalId,
  holdsSpecimens: z.boolean(),
  capacity: optionalCapacity,
});

export const storageLocationMoveSchema = z.object({
  newParentId: optionalId,
  reason: optionalText,
});

export type StorageLocationMutationInput = z.output<typeof storageLocationMutationSchema>;
export type StorageLocationMoveInput = z.output<typeof storageLocationMoveSchema>;

export type StorageLocationFormValues = {
  label: string;
  unitType: string;
  storageType: string;
  size: string;
  parentId: string;
  holdsSpecimens: boolean;
  capacity: string;
};

export type StorageLocationFormState = {
  values: StorageLocationFormValues;
  message?: string;
};

export type StorageLocationMoveState = {
  values: { newParentId: string; reason: string };
  message?: string;
};

export type StorageLocationCommandState = { message?: string };

function stringValue(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export function readStorageLocationForm(formData: FormData) {
  const values: StorageLocationFormValues = {
    label: stringValue(formData, "label"),
    unitType: stringValue(formData, "unitType"),
    storageType: stringValue(formData, "storageType"),
    size: stringValue(formData, "size"),
    parentId: stringValue(formData, "parentId"),
    holdsSpecimens: formData.get("holdsSpecimens") === "on",
    capacity: stringValue(formData, "capacity"),
  };

  return { values, result: storageLocationMutationSchema.safeParse(values) };
}

export function readStorageLocationMoveForm(formData: FormData) {
  const values = {
    newParentId: stringValue(formData, "newParentId"),
    reason: stringValue(formData, "reason"),
  };
  return { values, result: storageLocationMoveSchema.safeParse(values) };
}

export function firstValidationMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Check the submitted storage location values.";
}
