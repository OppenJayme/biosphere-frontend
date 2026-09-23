/**
 * Authenticated Cataloging actions for archival and public-display eligibility.
 * They expose no direct status setter; catalog completion stays a separate deferred rule.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { archiveSpecimen, setSpecimenPublicDisplay } from "./api";

export type LifecycleActionState = {
  message?: string;
};

function lifecycleError(error: unknown, operation: "archive" | "public-display") {
  if (error instanceof ApiError) {
    if (error.status === 400) {
      return operation === "archive"
        ? "Archiving is blocked while active specimen lots exist. Resolve them through the inventory workflow and reload."
        : "Only Cataloged specimens can be marked eligible for public display.";
    }
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) {
      return "You do not have permission to change this specimen's lifecycle settings.";
    }
    if (error.status === 404) return "The specimen no longer exists. Return to the catalog.";
    if (error.status === 409) {
      return "The specimen changed at the same time. Reload before trying again.";
    }
  }

  return "The lifecycle change could not be saved. Check your connection and try again.";
}

function refreshSpecimenPaths(specimenId: string) {
  revalidatePath("/specimens");
  revalidatePath(`/specimens/${specimenId}`);
  revalidatePath("/dashboard");
}

export async function setSpecimenPublicDisplayAction(
  specimenId: string,
  nextValue: boolean,
  _previousState: LifecycleActionState,
  _formData: FormData,
): Promise<LifecycleActionState> {
  void _previousState;
  void _formData;
  if (!(await verifySession())) {
    redirect(`/login?from=${encodeURIComponent(`/specimens/${specimenId}`)}`);
  }

  const command = z
    .object({ specimenId: z.uuid(), nextValue: z.boolean() })
    .safeParse({ specimenId, nextValue });
  if (!command.success) {
    return { message: "The specimen or requested eligibility value is invalid. Reload and try again." };
  }

  try {
    await setSpecimenPublicDisplay(command.data.specimenId, command.data.nextValue);
  } catch (error) {
    return { message: lifecycleError(error, "public-display") };
  }

  refreshSpecimenPaths(command.data.specimenId);
  redirect(
    `/specimens/${command.data.specimenId}?lifecycle=${command.data.nextValue ? "public-enabled" : "public-disabled"}`,
  );
}

export async function archiveSpecimenAction(
  specimenId: string,
  _previousState: LifecycleActionState,
  _formData: FormData,
): Promise<LifecycleActionState> {
  void _previousState;
  void _formData;
  if (!(await verifySession())) {
    redirect(`/login?from=${encodeURIComponent(`/specimens/${specimenId}`)}`);
  }

  const safeId = z.uuid().safeParse(specimenId);
  if (!safeId.success) {
    return { message: "The specimen identifier is invalid. Return to the catalog and try again." };
  }

  try {
    await archiveSpecimen(safeId.data);
  } catch (error) {
    return { message: lifecycleError(error, "archive") };
  }

  refreshSpecimenPaths(safeId.data);
  redirect(`/specimens/${safeId.data}?lifecycle=archived`);
}
