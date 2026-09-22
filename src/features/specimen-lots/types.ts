import { z } from "zod";

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

export type SpecimenLot = z.infer<typeof specimenLotSchema>;
