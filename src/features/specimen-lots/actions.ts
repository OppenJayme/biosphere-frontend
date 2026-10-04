"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import {
  adjustSpecimenLotQuantity,
  changeSpecimenLotCondition,
  createSpecimenLot,
  moveSpecimenLot,
  updateSpecimenLotNotes,
} from "./api";
import {
  readCreateSpecimenLotForm,
  type CreateLotFormState,
} from "./form";
import {
  lotOperationErrorMessage,
  readAdjustQuantityForm,
  readChangeConditionForm,
  readLotNotesForm,
  readMoveLotForm,
  type AdjustQuantityFormState,
  type ChangeConditionFormState,
  type LotNotesFormState,
  type LotOperationFailure,
  type MoveLotFormState,
} from "./operations";

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

// ---------------------------------------------------------------------------
// Controlled lot workflows. Each action receives the lot snapshot the curator saw, so the
// form can be validated against it; the backend re-checks everything inside a transaction.

export type LotSnapshot = {
  specimenId: string;
  lotId: string;
  quantity: number;
  storageUnitId: string;
  conditionClass: string;
  storageNotes: string | null;
};

const lotSnapshotSchema = z.object({
  specimenId: z.uuid(),
  lotId: z.uuid(),
  quantity: z.number().int().positive(),
  storageUnitId: z.uuid(),
  conditionClass: z.string(),
  storageNotes: z.string().nullable(),
});

const INVALID_LOT_MESSAGE =
  "This specimen lot identifier is invalid. Return to the specimen and try again.";

async function requireSession(snapshot: LotSnapshot) {
  if (!(await verifySession())) {
    redirect(
      `/login?from=${encodeURIComponent(`/specimens/${snapshot.specimenId}/lots/${snapshot.lotId}`)}`,
    );
  }
}

function failureOf(error: unknown): LotOperationFailure {
  return error instanceof ApiError ? { status: error.status, body: error.body } : null;
}

function refreshLotPaths(specimenId: string) {
  revalidatePath("/specimens");
  revalidatePath(`/specimens/${specimenId}`, "layout");
  revalidatePath("/storage");
  revalidatePath("/dashboard");
}

function lotNoticeHref(
  specimenId: string,
  lotId: string,
  notice: Record<string, string | number | boolean | null | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(notice)) {
    if (value === null || value === undefined || value === false) continue;
    params.set(key, value === true ? "1" : String(value));
  }
  return `/specimens/${specimenId}/lots/${lotId}?${params}`;
}

export async function moveSpecimenLotAction(
  snapshot: LotSnapshot,
  _previousState: MoveLotFormState,
  formData: FormData,
): Promise<MoveLotFormState> {
  await requireSession(snapshot);
  const lot = lotSnapshotSchema.safeParse(snapshot);
  const parsed = readMoveLotForm(formData, snapshot.quantity, snapshot.storageUnitId);
  if (!lot.success) return { values: parsed.values, message: INVALID_LOT_MESSAGE };
  if (!parsed.result.success) {
    return {
      values: parsed.values,
      errors: parsed.result.error.flatten().fieldErrors,
      message: "Check the highlighted fields before moving the lot.",
    };
  }

  let result;
  try {
    result = await moveSpecimenLot(lot.data.specimenId, lot.data.lotId, parsed.result.data);
  } catch (error) {
    return { values: parsed.values, message: lotOperationErrorMessage(failureOf(error), "move") };
  }

  refreshLotPaths(lot.data.specimenId);
  redirect(
    lotNoticeHref(lot.data.specimenId, result.targetLot.id, {
      lot: "moved",
      qty: result.transaction.quantityAffected ?? parsed.result.data.quantity,
      merged: result.mergedIntoExistingTarget,
      source: result.sourceDeactivated ? null : result.sourceLot.id,
      capacity: result.capacityWarning?.exceededBy,
    }),
  );
}

export async function changeSpecimenLotConditionAction(
  snapshot: LotSnapshot,
  _previousState: ChangeConditionFormState,
  formData: FormData,
): Promise<ChangeConditionFormState> {
  await requireSession(snapshot);
  const lot = lotSnapshotSchema.safeParse(snapshot);
  const parsed = readChangeConditionForm(formData, snapshot.quantity, snapshot.conditionClass);
  if (!lot.success) return { values: parsed.values, message: INVALID_LOT_MESSAGE };
  if (!parsed.result.success) {
    return {
      values: parsed.values,
      errors: parsed.result.error.flatten().fieldErrors,
      message: "Check the highlighted fields before changing the condition.",
    };
  }

  let result;
  try {
    result = await changeSpecimenLotCondition(
      lot.data.specimenId,
      lot.data.lotId,
      parsed.result.data,
    );
  } catch (error) {
    return {
      values: parsed.values,
      message: lotOperationErrorMessage(failureOf(error), "condition"),
    };
  }

  refreshLotPaths(lot.data.specimenId);
  redirect(
    lotNoticeHref(lot.data.specimenId, result.targetLot.id, {
      lot: "condition-changed",
      qty: result.transaction.quantityAffected ?? parsed.result.data.quantity,
      merged: result.mergedIntoExistingTarget,
      source: result.sourceDeactivated ? null : result.sourceLot.id,
    }),
  );
}

export async function adjustSpecimenLotQuantityAction(
  snapshot: LotSnapshot,
  _previousState: AdjustQuantityFormState,
  formData: FormData,
): Promise<AdjustQuantityFormState> {
  await requireSession(snapshot);
  const lot = lotSnapshotSchema.safeParse(snapshot);
  const parsed = readAdjustQuantityForm(formData, snapshot.quantity);
  if (!lot.success) return { values: parsed.values, message: INVALID_LOT_MESSAGE };
  if (!parsed.result.success) {
    return {
      values: parsed.values,
      errors: parsed.result.error.flatten().fieldErrors,
      message: "Check the highlighted fields before adjusting the quantity.",
    };
  }

  let result;
  try {
    result = await adjustSpecimenLotQuantity(
      lot.data.specimenId,
      lot.data.lotId,
      parsed.result.data,
    );
  } catch (error) {
    return { values: parsed.values, message: lotOperationErrorMessage(failureOf(error), "adjust") };
  }

  refreshLotPaths(lot.data.specimenId);
  redirect(
    lotNoticeHref(lot.data.specimenId, lot.data.lotId, {
      lot: "adjusted",
      delta: result.quantityDelta,
      capacity: result.capacityWarning?.exceededBy,
    }),
  );
}

export async function updateSpecimenLotNotesAction(
  snapshot: LotSnapshot,
  _previousState: LotNotesFormState,
  formData: FormData,
): Promise<LotNotesFormState> {
  await requireSession(snapshot);
  const lot = lotSnapshotSchema.safeParse(snapshot);
  const parsed = readLotNotesForm(formData, snapshot.storageNotes);
  if (!lot.success) return { values: parsed.values, message: INVALID_LOT_MESSAGE };
  if (!parsed.result.success) {
    return {
      values: parsed.values,
      errors: parsed.result.error.flatten().fieldErrors,
    };
  }

  try {
    await updateSpecimenLotNotes(lot.data.specimenId, lot.data.lotId, parsed.result.data);
  } catch (error) {
    return { values: parsed.values, message: lotOperationErrorMessage(failureOf(error), "notes") };
  }

  refreshLotPaths(lot.data.specimenId);
  redirect(lotNoticeHref(lot.data.specimenId, lot.data.lotId, { lot: "notes-updated" }));
}
