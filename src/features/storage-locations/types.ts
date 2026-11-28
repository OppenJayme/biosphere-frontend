/** Runtime contracts for the curator-managed storage hierarchy API. */

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

export const storageUnitPageSchema = z.object({
  items: storageUnitListSchema,
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export const storageMovementSchema = z.object({
  id: z.uuid(),
  storageUnitId: z.uuid(),
  fromStorageUnitId: z.uuid().nullable(),
  toStorageUnitId: z.uuid().nullable(),
  movedBy: z.uuid(),
  movedAt: z.string().min(1),
  reason: z.string().nullable(),
});

export const storageMovementListSchema = z.array(storageMovementSchema);

export type StorageUnit = z.infer<typeof storageUnitSchema>;
export type StorageUnitPage = z.infer<typeof storageUnitPageSchema>;
export type StorageLifecycle = "ACTIVE" | "ARCHIVED" | "ALL";
export type StorageMovement = z.infer<typeof storageMovementSchema>;

/**
 * GET /storage-locations/occupancy-summary: active specimen-holding units only. occupiedQuantity
 * sums the quantity of active lots placed directly in the unit; capacity is advisory
 * (REQ-4.6-11), and alertCount is 1 only when a unit is over its capacity.
 */
export const storageOccupancySchema = z.object({
  id: z.uuid(),
  label: z.string(),
  capacity: z.number().int().nullable(),
  occupiedQuantity: z.number().int().nonnegative(),
  alertCount: z.number().int().nonnegative(),
});
export const storageOccupancyListSchema = z.array(storageOccupancySchema);

/** The specimen fields the Locations tab shows for a lot; the backend sends more. */
export const storageInventorySpecimenSchema = z.object({
  id: z.uuid(),
  accessionNumber: z.string().nullable(),
  specimenCategory: z.string().nullable(),
  scientificName: z.string().nullable(),
  commonName: z.string().nullable(),
  status: z.string().min(1),
});

/** GET /storage-locations/:id/inventory: active lots placed directly in one unit. */
export const storageInventoryPageSchema = z.object({
  items: z.array(
    z.object({
      lot: z.object({
        id: z.uuid(),
        conditionClass: z.string().min(1),
        quantity: z.number().int().nonnegative(),
        updatedAt: z.string().min(1),
      }),
      specimen: storageInventorySpecimenSchema,
    }),
  ),
  totalLots: z.number().int().nonnegative(),
  totalQuantity: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});

export type StorageOccupancy = z.infer<typeof storageOccupancySchema>;
export type StorageInventoryPage = z.infer<typeof storageInventoryPageSchema>;
export type StorageInventoryItem = StorageInventoryPage["items"][number];
