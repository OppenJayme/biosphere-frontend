"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { accessionConflictFromBody } from "./accession";
import { createSpecimenRecord, saveSpecimenRecord } from "./api";
import { concurrentChangeMessage } from "./mutation-errors";
import {
  readSpecimenRecordForm,
  type RecordContext,
  type RecordFormErrors,
  type RecordFormValues,
} from "./record-form";
import { catalogRejectionSchema } from "./types";

export type RecordFormState = {
  values: RecordFormValues;
  errors?: RecordFormErrors;
  message?: string;
  /** Requirements the backend reported missing when "Save and catalog" was refused. */
  missingRequirements?: string[];
};

type RecordActionContext = RecordContext & { specimenId?: string };

function validationMessage(body: unknown) {
  const message = (body as { message?: unknown } | null)?.message;
  const first = Array.isArray(message) ? message[0] : message;
  return typeof first === "string" && first.length < 300 ? first : null;
}

function failureState(
  values: RecordFormValues,
  error: unknown,
  catalog: boolean,
): RecordFormState {
  if (!(error instanceof ApiError)) {
    return { values, message: "The record could not be saved. Check your connection and try again." };
  }
  if (error.status === 409) {
    const accession = accessionConflictFromBody(error.body);
    if (accession) {
      return { values, errors: { accessionNumber: [accession.message] }, message: "Check the highlighted fields." };
    }
    return { values, message: concurrentChangeMessage("saving") };
  }
  if (error.status === 400) {
    const rejection = catalogRejectionSchema.safeParse(error.body);
    if (catalog && rejection.success) {
      return {
        values,
        message: "Nothing was saved: these requirements are still missing. Complete them, or save as a draft.",
        missingRequirements: rejection.data.missingRequirements,
      };
    }
    return {
      values,
      message: `Nothing was saved. ${validationMessage(error.body) ?? "Check the values and try again."}`,
    };
  }
  if (error.status === 401) return { values, message: "Your session expired. Sign in and try again." };
  if (error.status === 403) return { values, message: "Only curators can save specimen records." };
  if (error.status === 404) return { values, message: "The specimen no longer exists. Return to the catalog." };
  return { values, message: "The record could not be saved. Check your connection and try again." };
}

/**
 * Saves the one-page catalog form. The submit button decides the intent: "draft" saves
 * whatever is filled in as Uncataloged; "catalog" saves and catalogs in the same transaction.
 */
export async function saveSpecimenRecordAction(
  context: RecordActionContext,
  _previousState: RecordFormState,
  formData: FormData,
): Promise<RecordFormState> {
  const here = context.specimenId ? `/specimens/${context.specimenId}/complete` : "/specimens/new";
  if (!(await verifySession())) redirect(`/login?from=${encodeURIComponent(here)}`);

  const catalog = formData.get("intent") === "catalog";
  const parsed = readSpecimenRecordForm(formData, context);
  if (!parsed.input) {
    return { values: parsed.values, errors: parsed.errors, message: "Check the highlighted fields before saving." };
  }

  let specimenId: string;
  try {
    if (context.mode === "complete") {
      const id = z.uuid().safeParse(context.specimenId);
      if (!id.success) return { values: parsed.values, message: "The specimen identifier is invalid." };
      specimenId = (await saveSpecimenRecord(id.data, { ...parsed.input, catalog })).id;
    } else {
      specimenId = (await createSpecimenRecord({ ...parsed.input, catalog })).id;
    }
  } catch (error) {
    return failureState(parsed.values, error, catalog);
  }

  revalidatePath("/specimens");
  revalidatePath("/dashboard");
  revalidatePath(`/specimens/${specimenId}`);
  // created=1 / updated=1 also start the details page's duplicate re-check, as the old forms did.
  const recheck = context.mode === "create" ? "created=1" : "updated=1";
  const notice = catalog ? "lifecycle=cataloged" : "record=saved";
  redirect(`/specimens/${specimenId}?${notice}&${recheck}`);
}
