/**
 * Authenticated Cataloging actions for cataloging, archival, and public-display eligibility.
 * There is no direct status setter; the backend re-checks required fields before cataloging.
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import {
  archiveSpecimen,
  completeCataloging,
  reopenCataloging,
  setSpecimenPublicDisplay,
} from "./api";
import { REOPEN_REASON_MAX } from "./lifecycle";
import { catalogRejectionSchema } from "./types";

export type LifecycleActionState = {
  message?: string;
};

export type CatalogActionState = {
  message?: string;
  /** Readable requirements the backend reported missing at submit time (data changed meanwhile). */
  missingRequirements?: string[];
};

export type ReopenActionState = {
  message?: string;
  values?: { reason: string };
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

export async function catalogSpecimenAction(
  specimenId: string,
  _previousState: CatalogActionState,
  _formData: FormData,
): Promise<CatalogActionState> {
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
    await completeCataloging(safeId.data);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 400) {
        const rejection = catalogRejectionSchema.safeParse(error.body);
        if (rejection.success) {
          return {
            message: "Some requirements are missing now. Complete them, then catalog again.",
            missingRequirements: rejection.data.missingRequirements,
          };
        }
        return { message: "Archived specimens cannot complete cataloging." };
      }
      if (error.status === 401) return { message: "Your session expired. Sign in and try again." };
      if (error.status === 403) return { message: "Only curators can catalog specimens." };
      if (error.status === 404) return { message: "The specimen no longer exists. Return to the catalog." };
      if (error.status === 409) {
        return { message: "The specimen changed at the same time. Reload before cataloging again." };
      }
    }
    return { message: "The specimen could not be cataloged. Check your connection and try again." };
  }

  refreshSpecimenPaths(safeId.data);
  redirect(`/specimens/${safeId.data}?lifecycle=cataloged`);
}

export async function reopenCatalogingAction(
  specimenId: string,
  _previousState: ReopenActionState,
  formData: FormData,
): Promise<ReopenActionState> {
  void _previousState;
  if (!(await verifySession())) {
    redirect(`/login?from=${encodeURIComponent(`/specimens/${specimenId}`)}`);
  }

  const rawReason = formData.get("reason");
  const values = { reason: typeof rawReason === "string" ? rawReason : "" };
  const parsed = z
    .object({
      specimenId: z.uuid(),
      reason: z
        .string()
        .trim()
        .min(1, "Enter why this record needs more catalog work.")
        .max(REOPEN_REASON_MAX, `Keep the reason to ${REOPEN_REASON_MAX} characters or fewer.`),
    })
    .safeParse({ specimenId, reason: values.reason });
  if (!parsed.success) {
    return { values, message: parsed.error.issues[0]?.message ?? "Check the reason and try again." };
  }

  try {
    await reopenCataloging(parsed.data.specimenId, parsed.data.reason);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 400) {
        return { values, message: "Archived specimens cannot be reopened, and a reason is required." };
      }
      if (error.status === 401) return { values, message: "Your session expired. Sign in and try again." };
      if (error.status === 403) return { values, message: "Only curators can reopen cataloging." };
      if (error.status === 404) return { values, message: "The specimen no longer exists. Return to the catalog." };
      if (error.status === 409) {
        return { values, message: "The specimen changed at the same time. Reload before reopening again." };
      }
    }
    return { values, message: "Cataloging could not be reopened. Check your connection and try again." };
  }

  refreshSpecimenPaths(parsed.data.specimenId);
  redirect(`/specimens/${parsed.data.specimenId}?lifecycle=reopened`);
}
