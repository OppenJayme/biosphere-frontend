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

function mutationErrorMessage(error: unknown, mode: ProvenanceFormMode) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return mode === "create"
        ? "Enter at least one valid provenance or preservation value before saving."
        : "No changes were saved. Change at least one provenance field and try again.";
    }
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) return "You do not have permission to change provenance records.";
    if (error.status === 404) {
      return "The specimen or provenance record no longer exists. Reload and try again.";
    }
    if (error.status === 409) {
      return "A provenance record was already created for this specimen. Reload before editing it.";
    }
  }

  return "The provenance record could not be saved. Check your connection and try again.";
}

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
    return { values: parsed.values, message: mutationErrorMessage(error, mode) };
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
