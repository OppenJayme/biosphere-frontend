/** Authenticated Server Actions for curator-owned storage location management. */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import {
  archiveStorageLocation,
  createStorageLocation,
  moveStorageLocation,
  updateStorageLocation,
} from "./api";
import {
  firstValidationMessage,
  readStorageLocationForm,
  readStorageLocationMoveForm,
  type StorageLocationCommandState,
  type StorageLocationFormState,
  type StorageLocationMoveState,
} from "./management";

type StorageOperation = "create" | "update" | "move" | "archive";

function storageLocationError(error: unknown, operation: StorageOperation) {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      if (operation === "archive") {
        return "This location still has active children or specimen lots. Resolve them before archiving.";
      }
      if (operation === "move") {
        return "Choose a different active parent that is not this location or one of its descendants.";
      }
      if (operation === "update") {
        return "Change at least one valid field. Active specimen assignments may block disabling specimen storage.";
      }
      return "Check the location fields and make sure the selected parent is active.";
    }
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) return "You do not have permission to manage storage locations.";
    if (error.status === 404) return "The selected storage location no longer exists. Reload the page.";
    if (error.status === 409) return "The storage hierarchy changed at the same time. Reload and try again.";
  }

  return "The storage location change could not be saved. Check your connection and try again.";
}

function refreshStorageConsumers() {
  revalidatePath("/storage");
  revalidatePath("/dashboard");
  revalidatePath("/audit-logs");
}

async function requireStorageSession() {
  if (!(await verifySession())) redirect("/login?from=/storage");
}

export async function createStorageLocationAction(
  _previousState: StorageLocationFormState,
  formData: FormData,
): Promise<StorageLocationFormState> {
  void _previousState;
  await requireStorageSession();
  const parsed = readStorageLocationForm(formData);

  if (!parsed.result.success) {
    return { values: parsed.values, message: firstValidationMessage(parsed.result.error) };
  }

  let created;
  try {
    created = await createStorageLocation(parsed.result.data);
  } catch (error) {
    return { values: parsed.values, message: storageLocationError(error, "create") };
  }

  refreshStorageConsumers();
  redirect(`/storage?selected=${created.id}&notice=created`);
}

export async function updateStorageLocationAction(
  storageUnitId: string,
  _previousState: StorageLocationFormState,
  formData: FormData,
): Promise<StorageLocationFormState> {
  void _previousState;
  await requireStorageSession();
  const parsed = readStorageLocationForm(formData);
  const safeId = z.uuid().safeParse(storageUnitId);

  if (!safeId.success) {
    return { values: parsed.values, message: "The storage location identifier is invalid. Reload and try again." };
  }
  if (!parsed.result.success) {
    return { values: parsed.values, message: firstValidationMessage(parsed.result.error) };
  }

  try {
    await updateStorageLocation(safeId.data, parsed.result.data);
  } catch (error) {
    return { values: parsed.values, message: storageLocationError(error, "update") };
  }

  refreshStorageConsumers();
  redirect(`/storage?selected=${safeId.data}&notice=updated`);
}

export async function moveStorageLocationAction(
  storageUnitId: string,
  _previousState: StorageLocationMoveState,
  formData: FormData,
): Promise<StorageLocationMoveState> {
  void _previousState;
  await requireStorageSession();
  const parsed = readStorageLocationMoveForm(formData);
  const safeId = z.uuid().safeParse(storageUnitId);

  if (!safeId.success) {
    return { values: parsed.values, message: "The storage location identifier is invalid. Reload and try again." };
  }
  if (!parsed.result.success) {
    return { values: parsed.values, message: firstValidationMessage(parsed.result.error) };
  }

  try {
    await moveStorageLocation(safeId.data, parsed.result.data);
  } catch (error) {
    return { values: parsed.values, message: storageLocationError(error, "move") };
  }

  refreshStorageConsumers();
  redirect(`/storage?selected=${safeId.data}&notice=moved`);
}

export async function archiveStorageLocationAction(
  storageUnitId: string,
  _previousState: StorageLocationCommandState,
  _formData: FormData,
): Promise<StorageLocationCommandState> {
  void _previousState;
  void _formData;
  await requireStorageSession();
  const safeId = z.uuid().safeParse(storageUnitId);

  if (!safeId.success) {
    return { message: "The storage location identifier is invalid. Reload and try again." };
  }

  try {
    await archiveStorageLocation(safeId.data);
  } catch (error) {
    return { message: storageLocationError(error, "archive") };
  }

  refreshStorageConsumers();
  redirect(`/storage?selected=${safeId.data}&notice=archived`);
}
