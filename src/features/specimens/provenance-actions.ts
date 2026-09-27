"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { createSpecimenProvenance, updateSpecimenProvenance } from "./api";
import {
  readProvenanceForm,
  type ProvenanceFormMode,
  type ProvenanceFormState,
} from "./provenance-form";
import { provenanceErrorMessage } from "./mutation-errors";


async function saveProvenance(
  specimenId: string,
  mode: ProvenanceFormMode,
  formData: FormData,
): Promise<ProvenanceFormState> {
  if (!(await verifySession())) redirect("/login?from=/specimens");

  const safeId = z.uuid().safeParse(specimenId);
  const parsed = readProvenanceForm(formData, mode);
  if (!safeId.success) {
    return {
      values: parsed.values,
      message: "This specimen identifier is invalid. Return to the catalog and try again.",
    };
  }

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
      await createSpecimenProvenance(safeId.data, parsed.result.data);
    } else {
      await updateSpecimenProvenance(safeId.data, parsed.result.data);
    }
  } catch (error) {
    return { values: parsed.values, message: provenanceErrorMessage(error instanceof ApiError ? error : null, mode) };
  }

  revalidatePath("/specimens");
  revalidatePath(`/specimens/${safeId.data}`);
  redirect(
    `/specimens/${safeId.data}?provenance=${mode === "create" ? "created" : "updated"}`,
  );
}

export async function createProvenanceAction(
  specimenId: string,
  _previousState: ProvenanceFormState,
  formData: FormData,
) {
  return saveProvenance(specimenId, "create", formData);
}

export async function updateProvenanceAction(
  specimenId: string,
  _previousState: ProvenanceFormState,
  formData: FormData,
) {
  return saveProvenance(specimenId, "update", formData);
}
