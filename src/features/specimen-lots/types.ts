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
