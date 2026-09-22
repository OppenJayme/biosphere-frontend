import { z } from "zod";

export const storageUnitSchema = z.object({
  id: z.uuid(),
  label: z.string().min(1),
  unitType: z.string().min(1),
  storageType: z.string().min(1),
  size: z.string().nullable(),
  parentId: z.uuid().nullable().optional(),
  holdsSpecimens: z.boolean(),
  capacity: z.number().int().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const storageUnitListSchema = z.array(storageUnitSchema);

export const storageOccupancySummarySchema = z.object({
  id: z.uuid(),
  label: z.string().min(1),
  capacity: z.number().int().nullable(),
  occupiedQuantity: z.number().int().nonnegative(),
  alertCount: z.number().int().nonnegative(),
});

export const storageOccupancySummaryListSchema = z.array(storageOccupancySummarySchema);

export type StorageUnit = z.infer<typeof storageUnitSchema>;
export type StorageOccupancySummary = z.infer<typeof storageOccupancySummarySchema>;
