/**
 * Authenticated Server Actions for small Cataloging media mutations.
 * File uploads use a bounded Route Handler so unrelated actions keep Next's 1 MB limit.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import {
  removeSpecimenMedia,
  setSpecimenMediaCover,
  updateSpecimenMedia,
} from "./api";
import {
  readSpecimenMediaMetadataForm,
  type MediaCommandState,
  type MediaFormState,
} from "./media-form";

function mediaMutationError(error: unknown, operation: "update" | "cover" | "remove") {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return operation === "update"
        ? "No changes were saved. Change the caption or display order and try again."
        : "The media change was rejected. Reload and try again.";
    }
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) return "You do not have permission to change specimen media.";
    if (error.status === 404) {
      return "The specimen or media record no longer exists. Reload and try again.";
    }
    if (error.status === 409) {
      return "Specimen media changed at the same time. Reload before trying again.";
    }
  }

  return "The media change could not be saved. Check your connection and try again.";
}

function parseMediaIds(specimenId: string, mediaId: string) {
  return z
    .object({ specimenId: z.uuid(), mediaId: z.uuid() })
    .safeParse({ specimenId, mediaId });
}

function revalidateMediaPaths(specimenId: string) {
  revalidatePath("/specimens");
  revalidatePath(`/specimens/${specimenId}`);
  revalidatePath(`/specimens/${specimenId}/media`);
}

export async function updateSpecimenMediaAction(
  specimenId: string,
  mediaId: string,
  _previousState: MediaFormState,
  formData: FormData,
): Promise<MediaFormState> {
  if (!(await verifySession())) redirect("/login?from=/specimens");

  const ids = parseMediaIds(specimenId, mediaId);
  const parsed = readSpecimenMediaMetadataForm(formData);
  if (!ids.success) {
    return {
      values: parsed.values,
      message: "This specimen or media identifier is invalid. Reload and try again.",
    };
  }
  if (!parsed.result.success) {
    return {
      values: parsed.values,
      errors: parsed.result.error.flatten().fieldErrors,
      message: "Check the media metadata before saving.",
    };
  }

  try {
    await updateSpecimenMedia(ids.data.specimenId, ids.data.mediaId, parsed.result.data);
  } catch (error) {
    return { values: parsed.values, message: mediaMutationError(error, "update") };
  }

  revalidateMediaPaths(ids.data.specimenId);
  redirect(`/specimens/${ids.data.specimenId}/media?media=updated`);
}

export async function setSpecimenMediaCoverAction(
  specimenId: string,
  mediaId: string,
  _previousState: MediaCommandState,
  _formData: FormData,
): Promise<MediaCommandState> {
  void _previousState;
  void _formData;
  if (!(await verifySession())) redirect("/login?from=/specimens");

  const ids = parseMediaIds(specimenId, mediaId);
  if (!ids.success) return { message: "This media identifier is invalid. Reload and try again." };

  try {
    await setSpecimenMediaCover(ids.data.specimenId, ids.data.mediaId);
  } catch (error) {
    return { message: mediaMutationError(error, "cover") };
  }

  revalidateMediaPaths(ids.data.specimenId);
  redirect(`/specimens/${ids.data.specimenId}/media?media=cover`);
}

export async function removeSpecimenMediaAction(
  specimenId: string,
  mediaId: string,
  _previousState: MediaCommandState,
  _formData: FormData,
): Promise<MediaCommandState> {
  void _previousState;
  void _formData;
  if (!(await verifySession())) redirect("/login?from=/specimens");

  const ids = parseMediaIds(specimenId, mediaId);
  if (!ids.success) return { message: "This media identifier is invalid. Reload and try again." };

  let cleanupPending: boolean;
  try {
    const result = await removeSpecimenMedia(ids.data.specimenId, ids.data.mediaId);
    cleanupPending = result.storageCleanupPending;
  } catch (error) {
    return { message: mediaMutationError(error, "remove") };
  }

  revalidateMediaPaths(ids.data.specimenId);
  redirect(
    `/specimens/${ids.data.specimenId}/media?media=${cleanupPending ? "removed-cleanup" : "removed"}`,
  );
}
