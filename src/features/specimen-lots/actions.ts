"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { createSpecimenLot } from "./api";
import {
  readCreateSpecimenLotForm,
  type CreateLotFormState,
} from "./form";

function createLotErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return "The lot could not be created. Check the quantity, condition, and selected storage location.";
    }
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) {
      return "You do not have permission to create specimen lots.";
    }
    if (error.status === 404) {
      return "The specimen or storage location no longer exists. Reload and try again.";
    }
    if (error.status === 409) {
      return "An active lot already uses that storage location and condition. Use its quantity-adjustment workflow instead.";
    }
  }

  return "The specimen lot could not be created. Check your connection and try again.";
}

export async function createSpecimenLotAction(
  specimenId: string,
  _previousState: CreateLotFormState,
  formData: FormData,
): Promise<CreateLotFormState> {
  if (!(await verifySession())) redirect("/login?from=/specimens");

  const safeId = z.uuid().safeParse(specimenId);
  const parsed = readCreateSpecimenLotForm(formData);
  if (!safeId.success) {
    return {
      values: parsed.values,
      message: "This specimen identifier is invalid. Return to the catalog and try again.",
    };
  }

  if (!parsed.result.success) {
    return {
      values: parsed.values,
      errors: parsed.result.error.flatten().fieldErrors,
      message: "Check the highlighted fields before creating the lot.",
    };
  }

  try {
    await createSpecimenLot(safeId.data, parsed.result.data);
  } catch (error) {
    return { values: parsed.values, message: createLotErrorMessage(error) };
  }

  revalidatePath("/specimens");
  revalidatePath(`/specimens/${safeId.data}`);
  redirect(`/specimens/${safeId.data}?lot=created`);
}
