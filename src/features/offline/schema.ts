import { z } from "zod";
import { SPECIMEN_GENDERS } from "./types";

const nullableText = (maximum?: number) => {
  const value = z.string().trim().min(1);
  return (maximum ? value.max(maximum) : value).nullable();
};

export const specimenDraftSchema = z
  .object({
    collectionId: z.uuid().nullable(),
    accessionNumber: nullableText(100),
    specimenCategory: nullableText(100),
    scientificName: nullableText(255),
    commonName: nullableText(255),
    gender: z.enum(SPECIMEN_GENDERS).nullable(),
    classificationStatus: nullableText(),
    remarks: nullableText(),
  })
  .strict();

export const specimenRecordSchema = specimenDraftSchema.extend({
  id: z.uuid(),
  status: z.enum(["UNCATALOGED", "CATALOGED", "ARCHIVED"]),
  publicDisplay: z.boolean(),
  createdBy: z.uuid(),
  updatedBy: z.uuid().nullable(),
  archivedBy: z.uuid().nullable(),
  archivedAt: z.string().nullable(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const syncSpecimenDraftRequestSchema = z
  .object({
    clientDraftId: z.uuid(),
    draft: specimenDraftSchema,
  })
  .strict();

export const syncSpecimenDraftResultSchema = z.object({
  clientDraftId: z.uuid(),
  alreadySynchronized: z.boolean(),
  specimen: specimenRecordSchema,
});

export const specimenListSchema = z.array(specimenRecordSchema);

function normalizedText(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function draftFromFormData(formData: FormData) {
  return specimenDraftSchema.parse({
    collectionId: null,
    accessionNumber: normalizedText(formData.get("accessionNumber")),
    specimenCategory: normalizedText(formData.get("specimenCategory")),
    scientificName: normalizedText(formData.get("scientificName")),
    commonName: normalizedText(formData.get("commonName")),
    gender: normalizedText(formData.get("gender")),
    classificationStatus: normalizedText(formData.get("classificationStatus")),
    remarks: normalizedText(formData.get("remarks")),
  });
}
