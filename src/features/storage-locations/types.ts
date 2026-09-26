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
