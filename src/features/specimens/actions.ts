"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { createSpecimen, updateSpecimen } from "./api";
import { readSpecimenForm, type SpecimenFormState } from "./form";

function errorMessage(error: unknown, operation: "create" | "update") {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return operation === "update"
        ? "No changes were saved. Change at least one core field and check the entered values."
        : "The draft could not be saved. Check the entered values and try again.";
    }
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) return "You do not have permission to change specimen records.";
    if (error.status === 404) {
      return "The specimen or selected collection no longer exists. Reload and try again.";
    }
    if (error.status === 409) {
      return "The specimen could not be saved because it conflicts with an existing record.";
    }
  }

  return "The specimen could not be saved right now. Check your connection and try again.";
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
    return { values: parsed.values, message: errorMessage(error, "create") };
  }

  revalidatePath("/specimens");
  redirect(`/specimens/${specimen.id}?created=1`);
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
    return { values: parsed.values, message: errorMessage(error, "update") };
  }

  revalidatePath("/specimens");
  revalidatePath(`/specimens/${safeId.data}`);
  redirect(`/specimens/${safeId.data}?updated=1`);
}
