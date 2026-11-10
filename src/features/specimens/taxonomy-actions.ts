"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { createSpecimenTaxonomy, updateSpecimenTaxonomy } from "./api";
import {
  readTaxonomyForm,
  type TaxonomyFormMode,
  type TaxonomyFormState,
} from "./taxonomy-form";
import { taxonomyErrorMessage } from "./mutation-errors";


function invalidIdState(formData: FormData, mode: TaxonomyFormMode): TaxonomyFormState {
  return {
    values: readTaxonomyForm(formData, mode).values,
    message: "This specimen identifier is invalid. Return to the catalog and try again.",
  };
}

async function saveTaxonomy(
  specimenId: string,
  mode: TaxonomyFormMode,
  formData: FormData,
): Promise<TaxonomyFormState> {
  if (!(await verifySession())) redirect("/login?from=/specimens");

  const safeId = z.uuid().safeParse(specimenId);
  if (!safeId.success) return invalidIdState(formData, mode);

  const parsed = readTaxonomyForm(formData, mode);
  if (!parsed.result.success) {
    const flattened = parsed.result.error.flatten();
    return {
      values: parsed.values,
      errors: flattened.fieldErrors,
      message: flattened.formErrors[0] ?? "Check the highlighted fields before saving.",
    };
  }

  try {
    if (mode === "create") {
      await createSpecimenTaxonomy(safeId.data, parsed.result.data);
    } else {
      await updateSpecimenTaxonomy(safeId.data, parsed.result.data);
    }
  } catch (error) {
    return { values: parsed.values, message: taxonomyErrorMessage(error instanceof ApiError ? error : null, mode) };
  }

  revalidatePath("/specimens");
  revalidatePath(`/specimens/${safeId.data}`);
  redirect(`/specimens/${safeId.data}?taxonomy=${mode === "create" ? "created" : "updated"}`);
}

export async function createTaxonomyAction(
  specimenId: string,
  _previousState: TaxonomyFormState,
  formData: FormData,
) {
  return saveTaxonomy(specimenId, "create", formData);
}

export async function updateTaxonomyAction(
  specimenId: string,
  _previousState: TaxonomyFormState,
  formData: FormData,
) {
  return saveTaxonomy(specimenId, "update", formData);
}
