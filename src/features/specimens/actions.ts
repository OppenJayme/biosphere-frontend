"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import {
  accessionCheckFromAvailability,
  accessionConflictFromBody,
  type AccessionCheckState,
} from "./accession";
import {
  checkAccessionNumber,
  checkSpecimenDuplicates,
  createSpecimen,
  updateSpecimen,
} from "./api";
import {
  duplicateCheckInputSchema,
  duplicateCheckOutcome,
  type DuplicateCheckState,
} from "./duplicates";
import { readSpecimenForm, type SpecimenFormState } from "./form";
import { specimenCoreErrorMessage, type MutationMode } from "./mutation-errors";

function specimenFailureState(
  values: SpecimenFormState["values"],
  error: unknown,
  mode: MutationMode,
): SpecimenFormState {
  const failure = error instanceof ApiError ? error : null;
  const accession = failure?.status === 409 ? accessionConflictFromBody(failure.body) : null;
  return {
    values,
    // Put the clash on the field itself so the curator sees what to change.
    errors: accession ? { accessionNumber: [accession.message] } : undefined,
    message: specimenCoreErrorMessage(failure, mode),
  };
}

export async function createSpecimenAction(
  _previousState: SpecimenFormState,
  formData: FormData,
): Promise<SpecimenFormState> {
  if (!(await verifySession())) redirect("/login?from=/specimens/new");

  const parsed = readSpecimenForm(formData);
  if (!parsed.result.success) {
    return {
      values: parsed.values,
      errors: parsed.result.error.flatten().fieldErrors,
      message: "Check the highlighted fields before saving.",
    };
  }

  let specimen;
  try {
    specimen = await createSpecimen(parsed.result.data);
  } catch (error) {
    return specimenFailureState(parsed.values, error, "create");
  }

  revalidatePath("/specimens");
  // The details page re-checks duplicates with the backend, so no result travels in the URL.
  redirect(`/specimens/${specimen.id}?created=1`);
}

/** Pre-save duplicate warning for the core form. Never blocks saving (REQ-4.4-21). */
export async function checkSpecimenDuplicatesAction(input: unknown): Promise<DuplicateCheckState> {
  if (!(await verifySession())) return { status: "unavailable" };

  const parsed = duplicateCheckInputSchema.safeParse(input);
  if (!parsed.success) return { status: "idle" };

  try {
    const result = await checkSpecimenDuplicates(parsed.data);
    const outcome = duplicateCheckOutcome(result);
    return outcome === "found"
      ? { status: "found", duplicates: result.possibleDuplicates }
      : { status: outcome };
  } catch {
    return { status: "unavailable" };
  }
}

export async function updateSpecimenAction(
  specimenId: string,
  _previousState: SpecimenFormState,
  formData: FormData,
): Promise<SpecimenFormState> {
  if (!(await verifySession())) redirect("/login?from=/specimens");

  const safeId = z.uuid().safeParse(specimenId);
  if (!safeId.success) {
    return {
      values: readSpecimenForm(formData).values,
      message: "This specimen identifier is invalid. Return to the catalog and try again.",
    };
  }

  const parsed = readSpecimenForm(formData);
  if (!parsed.result.success) {
    return {
      values: parsed.values,
      errors: parsed.result.error.flatten().fieldErrors,
      message: "Check the highlighted fields before saving.",
    };
  }

  try {
    await updateSpecimen(safeId.data, parsed.result.data);
  } catch (error) {
    return specimenFailureState(parsed.values, error, "update");
  }

  revalidatePath("/specimens");
  revalidatePath(`/specimens/${safeId.data}`);
  redirect(`/specimens/${safeId.data}?updated=1`);
}

const accessionCheckInputSchema = z.object({
  accessionNumber: z.string().trim().min(1).max(100),
  excludeSpecimenId: z.uuid().optional(),
});

/** Inline accession-number availability for the core form; advisory only, saves re-check. */
export async function checkAccessionNumberAction(input: unknown): Promise<AccessionCheckState> {
  if (!(await verifySession())) return { status: "unavailable" };

  const parsed = accessionCheckInputSchema.safeParse(input);
  if (!parsed.success) return { status: "idle" };

  try {
    return accessionCheckFromAvailability(
      await checkAccessionNumber(parsed.data.accessionNumber, parsed.data.excludeSpecimenId),
    );
  } catch {
    return { status: "unavailable" };
  }
}
