/**
 * Accession-number uniqueness (REQ-4.4-04, BR-01). The backend compares numbers trimmed and
 * case-insensitively against every specimen record, Archived ones included, and rejects a
 * clash with 409 `ACCESSION_NUMBER_TAKEN`. Kept free of server-only imports for unit tests.
 */

import { z } from "zod";
import { SPECIMEN_STATUSES } from "./types";

export const ACCESSION_NUMBER_TAKEN = "ACCESSION_NUMBER_TAKEN";

const accessionNumberHolderSchema = z.object({
  id: z.uuid(),
  accessionNumber: z.string(),
  scientificName: z.string().nullable(),
  commonName: z.string().nullable(),
  status: z.enum(SPECIMEN_STATUSES),
});

export type AccessionNumberHolder = z.infer<typeof accessionNumberHolderSchema>;

export const accessionNumberAvailabilitySchema = z.object({
  accessionNumber: z.string(),
  available: z.boolean(),
  conflictingSpecimen: accessionNumberHolderSchema.nullable(),
});

export type AccessionNumberAvailability = z.infer<typeof accessionNumberAvailabilitySchema>;

const accessionConflictBodySchema = z.object({
  code: z.literal(ACCESSION_NUMBER_TAKEN),
  accessionNumber: z.string(),
  conflictingSpecimen: accessionNumberHolderSchema.nullable().optional(),
});

export type AccessionCheckState =
  | { status: "idle" }
  | { status: "available" }
  | { status: "taken"; holder: AccessionNumberHolder | null; message: string }
  | { status: "unavailable" };

function holderLabel(holder: AccessionNumberHolder) {
  return holder.commonName ?? holder.scientificName ?? "an unnamed specimen";
}

/** Curator-facing explanation of why a number cannot be used. */
export function accessionTakenMessage(
  accessionNumber: string,
  holder: AccessionNumberHolder | null | undefined,
) {
  const value = accessionNumber.trim();
  if (!holder) return `Accession number “${value}” is already assigned to another specimen.`;
  const archived =
    holder.status === "ARCHIVED" ? " (archived; archived numbers are never reused)" : "";
  return `Accession number “${value}” is already assigned to ${holderLabel(holder)}${archived}.`;
}

/** Reads a backend 409 body; returns null when the conflict is not an accession clash. */
export function accessionConflictFromBody(
  body: unknown,
): { message: string; holder: AccessionNumberHolder | null } | null {
  const parsed = accessionConflictBodySchema.safeParse(body);
  if (!parsed.success) return null;
  const holder = parsed.data.conflictingSpecimen ?? null;
  return { message: accessionTakenMessage(parsed.data.accessionNumber, holder), holder };
}

export function accessionCheckFromAvailability(
  result: AccessionNumberAvailability,
): AccessionCheckState {
  return result.available
    ? { status: "available" }
    : {
        status: "taken",
        holder: result.conflictingSpecimen,
        message: accessionTakenMessage(result.accessionNumber, result.conflictingSpecimen),
      };
}
