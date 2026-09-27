"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { checkSpecimenDuplicates, createSpecimen, updateSpecimen } from "./api";
import {
  duplicateCheckInputSchema,
  duplicateCheckOutcome,
  type DuplicateCheckState,
} from "./duplicates";
import { readSpecimenForm, type SpecimenFormState } from "./form";
import { specimenCoreErrorMessage } from "./mutation-errors";


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
    return { values: parsed.values, message: specimenCoreErrorMessage(error instanceof ApiError ? error : null, "create") };
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
    return { values: parsed.values, message: specimenCoreErrorMessage(error instanceof ApiError ? error : null, "update") };
  }

  revalidatePath("/specimens");
  revalidatePath(`/specimens/${safeId.data}`);
  redirect(`/specimens/${safeId.data}?updated=1`);
}
