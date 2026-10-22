import { z } from "zod";

export const storageUnitSchema = z.object({
  id: z.uuid(),
  label: z.string().min(1),
  unitType: z.string().min(1),
  storageType: z.string().min(1),
  size: z.string().nullable(),
  parentId: z.uuid().nullable(),
  holdsSpecimens: z.boolean(),
  capacity: z.number().int().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const storageUnitPageSchema = z.object({
  items: z.array(storageUnitSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
});

export const specimenLotSchema = z.object({
  id: z.uuid(),
  specimenId: z.uuid(),
  storageUnitId: z.uuid(),
  conditionClass: z.string().min(1),
  quantity: z.number().int().positive(),
  storageNotes: z.string().nullable(),
  isActive: z.boolean(),
  createdBy: z.uuid(),
  updatedBy: z.uuid().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const specimenLotListSchema = z.array(specimenLotSchema);

export const activeSpecimenLotSchema = specimenLotSchema.extend({
  isActive: z.literal(true),
});

export type StorageUnit = z.infer<typeof storageUnitSchema>;
export type SpecimenLot = z.infer<typeof specimenLotSchema>;

export type StorageUnitOption = {
  id: string;
  label: string;
};

export function buildAssignableStorageUnitOptions(
  units: StorageUnit[],
): StorageUnitOption[] {
  const byId = new Map(units.map((unit) => [unit.id, unit]));

  function pathFor(unit: StorageUnit) {
    const labels = [unit.label];
    const visited = new Set([unit.id]);
    let parentId = unit.parentId ?? null;

    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = byId.get(parentId);
      if (!parent) break;
      labels.unshift(parent.label);
      parentId = parent.parentId ?? null;
    }

    return labels.join(" / ");
  }

  return units
    .filter((unit) => unit.holdsSpecimens && unit.archivedAt === null)
    .map((unit) => ({
      id: unit.id,
      label: `${pathFor(unit)} (${unit.unitType} · ${unit.storageType})`,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

export const LOT_TRANSACTION_TYPES = [
  "MOVEMENT",
  "CONDITION_CHANGE",
  "SPLIT",
  "MERGE",
  "QUANTITY_ADJUSTMENT",
] as const;

export const QUANTITY_ADJUSTMENT_TYPES = [
  "ADDITION",
  "REMOVAL",
  "TRANSFER_OUT",
  "DEACCESSION",
  "MISSING_LOSS",
  "DESTRUCTION",
  "TEMPORARY_ABSENCE",
  "DATA_CORRECTION",
] as const;

export type LotTransactionType = (typeof LOT_TRANSACTION_TYPES)[number];
export type QuantityAdjustmentType = (typeof QUANTITY_ADJUSTMENT_TYPES)[number];

export const storageCapacityWarningSchema = z.object({
  storageUnitId: z.uuid(),
  storageUnitLabel: z.string(),
  capacity: z.number().int(),
  occupiedQuantity: z.number().int(),
  exceededBy: z.number().int().positive(),
});

export const specimenLotTransactionSchema = z.object({
  id: z.uuid(),
  sourceLotId: z.uuid().nullable(),
  targetLotId: z.uuid().nullable(),
  transactionType: z.enum(LOT_TRANSACTION_TYPES),
  quantityAffected: z.number().int().nullable(),
  adjustmentType: z.enum(QUANTITY_ADJUSTMENT_TYPES).nullable(),
  reason: z.string().nullable(),
  performedBy: z.uuid(),
  createdAt: z.string().min(1),
});

export const specimenLotTransactionPageSchema = z.object({
  items: z.array(specimenLotTransactionSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
  total: z.number().int().nonnegative(),
});

export const specimenLotHistoryEntrySchema = specimenLotTransactionSchema.extend({
  specimenId: z.uuid().nullable(),
  performedByName: z.string(),
  fromStorageUnitId: z.uuid().nullable(),
  toStorageUnitId: z.uuid().nullable(),
  fromConditionClass: z.string().nullable(),
  toConditionClass: z.string().nullable(),
});

export const specimenLotHistoryPageSchema = specimenLotTransactionPageSchema.extend({
  items: z.array(specimenLotHistoryEntrySchema),
});

export const specimenLotSummarySchema = z.object({
  specimenId: z.uuid(),
  activeLotCount: z.number().int().nonnegative(),
  totalQuantity: z.number().int().nonnegative(),
});

export const specimenLotOperationResultSchema = z.object({
  operation: z.enum(["MOVEMENT", "CONDITION_CHANGE"]),
  sourceLot: specimenLotSchema,
  targetLot: specimenLotSchema,
  transaction: specimenLotTransactionSchema,
  sourceDeactivated: z.boolean(),
  mergedIntoExistingTarget: z.boolean(),
  capacityWarning: storageCapacityWarningSchema.nullable(),
});

export const specimenLotQuantityAdjustmentResultSchema = z.object({
  adjustmentType: z.enum(QUANTITY_ADJUSTMENT_TYPES),
  quantityDelta: z.number().int(),
  previousQuantity: z.number().int().positive(),
  resultingQuantity: z.number().int().nonnegative(),
  lot: specimenLotSchema,
  transaction: specimenLotTransactionSchema,
  lotDeactivated: z.boolean(),
  capacityWarning: storageCapacityWarningSchema.nullable(),
});

export type StorageCapacityWarning = z.infer<typeof storageCapacityWarningSchema>;
export type SpecimenLotTransaction = z.infer<typeof specimenLotTransactionSchema>;
export type SpecimenLotTransactionPage = z.infer<typeof specimenLotTransactionPageSchema>;
export type SpecimenLotHistoryEntry = z.infer<typeof specimenLotHistoryEntrySchema>;
export type SpecimenLotHistoryPage = z.infer<typeof specimenLotHistoryPageSchema>;
export type SpecimenLotSummary = z.infer<typeof specimenLotSummarySchema>;
export type SpecimenLotOperationResult = z.infer<typeof specimenLotOperationResultSchema>;
export type SpecimenLotQuantityAdjustmentResult = z.infer<
  typeof specimenLotQuantityAdjustmentResultSchema
>;

/** Path labels for every known unit (archived included) so history can name past locations. */
export function buildStorageUnitPathLabels(units: StorageUnit[]): Map<string, string> {
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const labels = new Map<string, string>();

  for (const unit of units) {
    const path = [unit.label];
    const visited = new Set([unit.id]);
    let parentId = unit.parentId;
    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = byId.get(parentId);
      if (!parent) break;
      path.unshift(parent.label);
      parentId = parent.parentId;
    }
    labels.set(unit.id, path.join(" / "));
  }

  return labels;
}
