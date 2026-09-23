/**
 * Authenticated Server Actions for curator-managed specimen collections.
 * The protected NestJS API remains authoritative for role checks and audit transactions.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { createCollection, updateCollection } from "./api";
import {
  readCollectionForm,
  type CollectionFormState,
} from "./collection-management";

function collectionError(error: unknown, operation: "create" | "rename") {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return operation === "rename"
        ? "Enter a different valid collection name before saving."
        : "Enter a valid collection name before saving.";
    }
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) return "You do not have permission to manage collections.";
    if (error.status === 404) return "This collection no longer exists. Reload the list.";
    if (error.status === 409) {
      return "The collection changed at the same time. Reload and try again.";
    }
  }

  return "The collection could not be saved. Check your connection and try again.";
}

function refreshCollectionConsumers() {
  revalidatePath("/specimens/collections");
  revalidatePath("/specimens");
  revalidatePath("/specimens/new");
  revalidatePath("/specimens/[id]/edit", "page");
}

export async function createCollectionAction(
  _previousState: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  void _previousState;
  if (!(await verifySession())) redirect("/login?from=/specimens/collections");

  const parsed = readCollectionForm(formData);
  if (!parsed.result.success) {
    return {
      value: parsed.value,
      error: parsed.result.error.flatten().fieldErrors.collectionName?.[0] ??
        "Enter a valid collection name.",
    };
  }

  try {
    await createCollection(parsed.result.data);
  } catch (error) {
    return { value: parsed.value, error: collectionError(error, "create") };
  }

  refreshCollectionConsumers();
  redirect("/specimens/collections?notice=created");
}

export async function renameCollectionAction(
  collectionId: string,
  _previousState: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  void _previousState;
  if (!(await verifySession())) redirect("/login?from=/specimens/collections");

  const safeId = z.uuid().safeParse(collectionId);
  const parsed = readCollectionForm(formData);
  if (!safeId.success) {
    return {
      value: parsed.value,
      error: "This collection identifier is invalid. Reload the list and try again.",
    };
  }
  if (!parsed.result.success) {
    return {
      value: parsed.value,
      error: parsed.result.error.flatten().fieldErrors.collectionName?.[0] ??
        "Enter a valid collection name.",
    };
  }

  try {
    await updateCollection(safeId.data, parsed.result.data);
  } catch (error) {
    return { value: parsed.value, error: collectionError(error, "rename") };
  }

  refreshCollectionConsumers();
  redirect("/specimens/collections?notice=renamed");
}
