/**
 * Form parsing, labels, and error mapping for the controlled specimen-lot workflows
 * (movement, condition change, quantity adjustment, storage notes).
 * Kept free of server-only imports so the rules can be unit tested.
 */

import { z } from "zod";
import {
  LOT_TRANSACTION_TYPES,
  QUANTITY_ADJUSTMENT_TYPES,
  type LotTransactionType,
  type QuantityAdjustmentType,
} from "./types";

const POSTGRES_INTEGER_MAX = 2_147_483_647;
export const ADJUSTMENT_REASON_MAX = 2000;

export type LotOperationFormState<Field extends string> = {
  values: Record<Field, string>;
  errors?: Partial<Record<Field, string[]>>;
  message?: string;
};

function formString(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function readValues<Field extends string>(fields: readonly Field[], formData: FormData) {
  return Object.fromEntries(
    fields.map((field) => [field, formString(formData.get(field))]),
  ) as Record<Field, string>;
}

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

function quantityWithin(max: number) {
  return z
    .string()
    .trim()
    .regex(/^\d+$/, "Enter a whole number greater than zero.")
    .transform(Number)
    .pipe(
      z
        .number()
        .int()
        .min(1, "Quantity must be at least 1.")
        .max(max, `Quantity cannot exceed ${max}.`),
    );
}

/** Collapse internal whitespace the same way the backend normalizes condition classes. */
function conditionText(message: string) {
  return z
    .string()
    .transform((value) => value.trim().replace(/\s+/g, " "))
    .pipe(z.string().min(1, message));
}

// ---------------------------------------------------------------------------
// Movement

export const MOVE_LOT_FORM_FIELDS = ["targetStorageUnitId", "quantity", "reason"] as const;
export type MoveLotFormField = (typeof MOVE_LOT_FORM_FIELDS)[number];
export type MoveLotFormState = LotOperationFormState<MoveLotFormField>;

export function emptyMoveLotValues(lotQuantity: number): Record<MoveLotFormField, string> {
  return { targetStorageUnitId: "", quantity: String(lotQuantity), reason: "" };
}

export function moveLotFormSchema(lotQuantity: number, currentStorageUnitId: string) {
  return z.object({
    targetStorageUnitId: z
      .uuid("Select a valid destination storage location.")
      .refine((id) => id !== currentStorageUnitId, "Select a different storage location."),
    quantity: quantityWithin(lotQuantity),
    reason: optionalText,
  });
}

export type MoveLotInput = z.output<ReturnType<typeof moveLotFormSchema>>;

export function readMoveLotForm(
  formData: FormData,
  lotQuantity: number,
  currentStorageUnitId: string,
) {
  const values = readValues(MOVE_LOT_FORM_FIELDS, formData);
  return {
    values,
    result: moveLotFormSchema(lotQuantity, currentStorageUnitId).safeParse(values),
  };
}

// ---------------------------------------------------------------------------
// Condition change

export const CHANGE_CONDITION_FORM_FIELDS = [
  "targetConditionClass",
  "quantity",
  "reason",
] as const;
export type ChangeConditionFormField = (typeof CHANGE_CONDITION_FORM_FIELDS)[number];
export type ChangeConditionFormState = LotOperationFormState<ChangeConditionFormField>;

export function emptyChangeConditionValues(
  lotQuantity: number,
): Record<ChangeConditionFormField, string> {
  return { targetConditionClass: "", quantity: String(lotQuantity), reason: "" };
}

export function changeConditionFormSchema(lotQuantity: number, currentCondition: string) {
  return z.object({
    targetConditionClass: conditionText("Enter the new condition.").refine(
      // Matching is case-insensitive on the backend, so "good" is not a change from "Good".
      (value) => value.toLocaleLowerCase() !== currentCondition.toLocaleLowerCase(),
      "Enter a condition different from the current one.",
    ),
    quantity: quantityWithin(lotQuantity),
    reason: optionalText,
  });
}

export type ChangeLotConditionInput = z.output<ReturnType<typeof changeConditionFormSchema>>;

export function readChangeConditionForm(
  formData: FormData,
  lotQuantity: number,
  currentCondition: string,
) {
  const values = readValues(CHANGE_CONDITION_FORM_FIELDS, formData);
  return {
    values,
    result: changeConditionFormSchema(lotQuantity, currentCondition).safeParse(values),
  };
}

// ---------------------------------------------------------------------------
// Quantity adjustment

export const ADJUST_QUANTITY_FORM_FIELDS = [
  "adjustmentType",
  "direction",
  "quantity",
  "reason",
] as const;
export type AdjustQuantityFormField = (typeof ADJUST_QUANTITY_FORM_FIELDS)[number];
export type AdjustQuantityFormState = LotOperationFormState<AdjustQuantityFormField>;

export const EMPTY_ADJUST_QUANTITY_VALUES: Record<AdjustQuantityFormField, string> = {
  adjustmentType: "",
  direction: "decrease",
  quantity: "",
  reason: "",
};

/** Whether an adjustment type adds to, removes from, or (data correction) may do either. */
export function adjustmentDirection(
  type: QuantityAdjustmentType,
): "increase" | "decrease" | "either" {
  if (type === "ADDITION") return "increase";
  if (type === "DATA_CORRECTION") return "either";
  return "decrease";
}

export function adjustQuantityFormSchema(lotQuantity: number) {
  return z
    .object({
      adjustmentType: z.enum(QUANTITY_ADJUSTMENT_TYPES, "Select an adjustment type."),
      direction: z.enum(["increase", "decrease"]),
      quantity: quantityWithin(POSTGRES_INTEGER_MAX),
      reason: z
        .string()
        .trim()
        .min(1, "Enter the reason for this adjustment.")
        .max(ADJUSTMENT_REASON_MAX, `Keep the reason under ${ADJUSTMENT_REASON_MAX} characters.`),
    })
    .transform((value, context) => {
      const fixed = adjustmentDirection(value.adjustmentType);
      const direction = fixed === "either" ? value.direction : fixed;

      if (direction === "decrease" && value.quantity > lotQuantity) {
        context.addIssue({
          code: "custom",
          path: ["quantity"],
          message: `Cannot remove more than the current quantity of ${lotQuantity}.`,
        });
        return z.NEVER;
      }
      if (direction === "increase" && value.quantity > POSTGRES_INTEGER_MAX - lotQuantity) {
        context.addIssue({
          code: "custom",
          path: ["quantity"],
          message: "This addition would exceed the maximum supported lot quantity.",
        });
        return z.NEVER;
      }

      return {
        adjustmentType: value.adjustmentType,
        quantityDelta: direction === "increase" ? value.quantity : -value.quantity,
        // The backend rejects the change with 409 if the lot changed after this screen loaded.
        expectedQuantity: lotQuantity,
        reason: value.reason,
      };
    });
}

export type AdjustLotQuantityInput = z.output<ReturnType<typeof adjustQuantityFormSchema>>;

export function readAdjustQuantityForm(formData: FormData, lotQuantity: number) {
  const values = readValues(ADJUST_QUANTITY_FORM_FIELDS, formData);
  if (!values.direction) values.direction = "decrease";
  return { values, result: adjustQuantityFormSchema(lotQuantity).safeParse(values) };
}

// ---------------------------------------------------------------------------
// Storage notes

export const LOT_NOTES_FORM_FIELDS = ["storageNotes"] as const;
export type LotNotesFormField = (typeof LOT_NOTES_FORM_FIELDS)[number];
export type LotNotesFormState = LotOperationFormState<LotNotesFormField>;

export function lotNotesFormSchema(currentNotes: string | null) {
  return z.object({
    storageNotes: optionalText.refine(
      (value) => value !== (currentNotes?.trim() || null),
      "Change the storage notes before saving.",
    ),
  });
}

export type UpdateLotNotesInput = z.output<ReturnType<typeof lotNotesFormSchema>>;

export function readLotNotesForm(formData: FormData, currentNotes: string | null) {
  const values = readValues(LOT_NOTES_FORM_FIELDS, formData);
  return { values, result: lotNotesFormSchema(currentNotes).safeParse(values) };
}

// ---------------------------------------------------------------------------
// Labels

const TRANSACTION_LABELS: Record<LotTransactionType, string> = {
  MOVEMENT: "Movement",
  CONDITION_CHANGE: "Condition change",
  SPLIT: "Split",
  MERGE: "Merge",
  QUANTITY_ADJUSTMENT: "Quantity adjustment",
};

const ADJUSTMENT_LABELS: Record<QuantityAdjustmentType, string> = {
  ADDITION: "Addition",
  REMOVAL: "Removal",
  TRANSFER_OUT: "Transfer out of the museum",
  DEACCESSION: "Deaccession",
  MISSING_LOSS: "Missing / loss",
  DESTRUCTION: "Destruction",
  TEMPORARY_ABSENCE: "Temporary absence (loan, conservation)",
  DATA_CORRECTION: "Data correction",
};

export function transactionTypeLabel(type: LotTransactionType) {
  return TRANSACTION_LABELS[type];
}

export function adjustmentTypeLabel(type: QuantityAdjustmentType) {
  return ADJUSTMENT_LABELS[type];
}

export const ADJUSTMENT_TYPE_OPTIONS = QUANTITY_ADJUSTMENT_TYPES.map((value) => ({
  value,
  label: ADJUSTMENT_LABELS[value],
}));

export const TRANSACTION_TYPE_OPTIONS = LOT_TRANSACTION_TYPES.map((value) => ({
  value,
  label: TRANSACTION_LABELS[value],
}));

// ---------------------------------------------------------------------------
// History query (URL search params)

export const LOT_HISTORY_PAGE_SIZE = 25;

export type LotHistorySearch = {
  page: number;
  transactionType?: LotTransactionType;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseLotHistorySearch(
  params: Record<string, string | string[] | undefined>,
): LotHistorySearch {
  const page = Number(firstValue(params.page));
  const type = z.enum(LOT_TRANSACTION_TYPES).safeParse(firstValue(params.type));
  return {
    page: Number.isInteger(page) && page >= 1 && page <= 1_000_000 ? page : 1,
    transactionType: type.success ? type.data : undefined,
  };
}

export function lotHistoryHref(basePath: string, search: LotHistorySearch, page = search.page) {
  const params = new URLSearchParams();
  if (search.transactionType) params.set("type", search.transactionType);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

// ---------------------------------------------------------------------------
// Errors

export type LotOperation = "move" | "condition" | "adjust" | "notes";

/** Minimal shape of a backend ApiError that these mappings read. */
export type LotOperationFailure = { status: number; body: unknown } | null;

const OPERATION_NOUN: Record<LotOperation, string> = {
  move: "movement",
  condition: "condition change",
  adjust: "quantity adjustment",
  notes: "storage-notes change",
};

/**
 * The lot service's 400/409 messages are written for curators (e.g. "Quantity 5 exceeds the
 * source lot quantity of 3."). Validation messages that name DTO fields or carry raw UUIDs
 * are not, so those fall back to the generic text.
 */
export function readableLotMessage(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("message" in body)) return null;
  const raw = (body as { message: unknown }).message;
  const message = Array.isArray(raw) ? raw.find((item) => typeof item === "string") : raw;
  if (typeof message !== "string" || !message.trim()) return null;
  if (/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(message)) return null;
  if (/\b[a-z]+[A-Z][A-Za-z]*\b/.test(message)) return null;
  return message;
}

export function lotOperationErrorMessage(failure: LotOperationFailure, operation: LotOperation) {
  const noun = OPERATION_NOUN[operation];
  if (failure) {
    if (failure.status === 400) {
      return (
        readableLotMessage(failure.body) ??
        `The ${noun} was rejected. Check the entered values and try again.`
      );
    }
    if (failure.status === 401) return "Your session expired. Sign in and try again.";
    if (failure.status === 403) return "You do not have permission to change specimen lots.";
    if (failure.status === 404) {
      return "The specimen, lot, or storage location no longer exists. Reload and try again.";
    }
    if (failure.status === 409) {
      return (
        readableLotMessage(failure.body) ??
        "This lot changed at the same time. Reload the lot and try again."
      );
    }
  }

  return `The ${noun} could not be saved. Check your connection and try again.`;
}
