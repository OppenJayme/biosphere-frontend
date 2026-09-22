/**
 * Authenticated Server Actions for Cataloging tag relationships.
 * The NestJS backend remains authoritative for CURATOR access, concurrency, and auditing.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { attachSpecimenTag, detachSpecimenTag } from "./api";
import {
  readAttachSpecimenTagForm,
  type DetachTagState,
  type TagFormState,
} from "./tag-form";

function tagMutationError(error: unknown, operation: "attach" | "detach") {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return "The tag change was rejected. Check the tag name and specimen status.";
    }
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) return "You do not have permission to change specimen tags.";
    if (error.status === 404) {
      return operation === "detach"
        ? "The specimen or tag relationship no longer exists. Reload and try again."
        : "The specimen no longer exists. Return to the catalog and try again.";
    }
    if (error.status === 409) {
      return "The specimen tags changed at the same time. Reload and try again.";
    }
  }

  return "The tag change could not be saved. Check your connection and try again.";
}

function revalidateSpecimenTagPaths(specimenId: string) {
  revalidatePath("/specimens");
  revalidatePath(`/specimens/${specimenId}`);
  revalidatePath(`/specimens/${specimenId}/tags`);
}

export async function attachSpecimenTagAction(
  specimenId: string,
  _previousState: TagFormState,
  formData: FormData,
): Promise<TagFormState> {
  if (!(await verifySession())) redirect("/login?from=/specimens");

  const safeSpecimenId = z.uuid().safeParse(specimenId);
  const parsed = readAttachSpecimenTagForm(formData);
  if (!safeSpecimenId.success) {
    return {
      values: parsed.values,
      message: "This specimen identifier is invalid. Return to the catalog and try again.",
    };
  }
  if (!parsed.result.success) {
    return {
      values: parsed.values,
      errors: parsed.result.error.flatten().fieldErrors,
      message: "Check the tag name before attaching it.",
    };
  }

  let result;
  try {
    result = await attachSpecimenTag(safeSpecimenId.data, parsed.result.data);
  } catch (error) {
    return { values: parsed.values, message: tagMutationError(error, "attach") };
  }

  revalidateSpecimenTagPaths(safeSpecimenId.data);
  redirect(
    `/specimens/${safeSpecimenId.data}/tags?tag=${result.attached ? "attached" : "existing"}`,
  );
}

export async function detachSpecimenTagAction(
  specimenId: string,
  tagId: string,
  _previousState: DetachTagState,
  _formData: FormData,
): Promise<DetachTagState> {
  void _previousState;
  void _formData;

  if (!(await verifySession())) redirect("/login?from=/specimens");

  const safeIds = z
    .object({ specimenId: z.uuid(), tagId: z.uuid() })
    .safeParse({ specimenId, tagId });
  if (!safeIds.success) {
    return { message: "This specimen or tag identifier is invalid. Reload and try again." };
  }

  try {
    await detachSpecimenTag(safeIds.data.specimenId, safeIds.data.tagId);
  } catch (error) {
    return { message: tagMutationError(error, "detach") };
  }

  revalidateSpecimenTagPaths(safeIds.data.specimenId);
  redirect(`/specimens/${safeIds.data.specimenId}/tags?tag=detached`);
}
