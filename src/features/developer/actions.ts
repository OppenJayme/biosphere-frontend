/** Authenticated Server Actions for the restricted Developer interface (SRS 4.2). */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { onboardCurator, removeArAsset, setArAssetEnabled, updateCuratorStatus } from "./api";
import {
  firstValidationMessage,
  readCuratorStatusForm,
  readOnboardCuratorForm,
  type CuratorStatusFormState,
  type OnboardFormState,
} from "./form";
import { getDeveloperAccess } from "./session";
import type { ArAsset } from "./types";

export type ArAssetCommandResult =
  | { ok: true; asset: ArAsset }
  | { ok: true; removedId: string }
  | { ok: false; message: string };

type DeveloperOperation = "onboard" | "status" | "activate" | "deactivate" | "remove";

function developerError(error: unknown, operation: DeveloperOperation) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) {
      return operation === "status"
        ? "Only curator accounts can be changed from the Developer interface."
        : "Your account is not authorized for restricted developer functions.";
    }
    if (error.status === 404) {
      return operation === "status"
        ? "This curator account no longer exists. Reload the list."
        : "No AR asset exists with that ID. Check the ID and try again.";
    }
    if (error.status === 409 && operation === "onboard") {
      return "The invitation could not be sent. The email may already belong to an existing account.";
    }
    if (error.status === 400) {
      return operation === "onboard"
        ? "Check the curator's email address and full name."
        : "The backend rejected this request. Check the values and try again.";
    }
    if (error.status === 429) return "Too many requests. Wait a minute and try again.";
    if (error.status >= 500 && operation === "onboard") {
      // The invite may already have been emailed; retrying blindly could double-provision.
      return "The onboarding did not finish. Check the curator list and the audit log before retrying.";
    }
  }
  return "The change could not be saved. Check your connection and try again.";
}

async function requireDeveloper() {
  const access = await getDeveloperAccess();
  if (access.state === "signed-out") redirect("/login?from=/developer");
  return access.state === "developer";
}

const NOT_DEVELOPER = "Your account is not authorized for restricted developer functions.";

export async function onboardCuratorAction(
  _previousState: OnboardFormState,
  formData: FormData,
): Promise<OnboardFormState> {
  void _previousState;
  const parsed = readOnboardCuratorForm(formData);
  if (!(await requireDeveloper())) return { values: parsed.values, message: NOT_DEVELOPER };
  if (!parsed.result.success) {
    return { values: parsed.values, message: firstValidationMessage(parsed.result.error) };
  }

  try {
    await onboardCurator(parsed.result.data);
  } catch (error) {
    return { values: parsed.values, message: developerError(error, "onboard") };
  }

  revalidatePath("/developer");
  return {
    values: { email: "", fullName: "" },
    success: `A password-setup invitation was sent to ${parsed.result.data.email}.`,
  };
}

export async function updateCuratorStatusAction(
  curatorId: string,
  _previousState: CuratorStatusFormState,
  formData: FormData,
): Promise<CuratorStatusFormState> {
  void _previousState;
  if (!(await requireDeveloper())) return { message: NOT_DEVELOPER };

  const id = z.uuid().safeParse(curatorId);
  if (!id.success) return { message: "The curator identifier is invalid. Reload and try again." };

  const parsed = readCuratorStatusForm(formData);
  if (!parsed.success) return { message: firstValidationMessage(parsed.error) };

  try {
    await updateCuratorStatus(id.data, parsed.data);
  } catch (error) {
    return { message: developerError(error, "status") };
  }

  revalidatePath("/developer");
  return {};
}

export async function setArAssetEnabledAction(assetId: string, enabled: boolean): Promise<ArAssetCommandResult> {
  if (!(await requireDeveloper())) return { ok: false, message: NOT_DEVELOPER };

  const id = z.uuid().safeParse(assetId.trim());
  if (!id.success) return { ok: false, message: "Enter a valid AR asset ID." };

  try {
    return { ok: true, asset: await setArAssetEnabled(id.data, enabled === true) };
  } catch (error) {
    return { ok: false, message: developerError(error, enabled ? "activate" : "deactivate") };
  }
}

export async function removeArAssetAction(assetId: string): Promise<ArAssetCommandResult> {
  if (!(await requireDeveloper())) return { ok: false, message: NOT_DEVELOPER };

  const id = z.uuid().safeParse(assetId.trim());
  if (!id.success) return { ok: false, message: "Enter a valid AR asset ID." };

  try {
    const result = await removeArAsset(id.data);
    return { ok: true, removedId: result.id };
  } catch (error) {
    return { ok: false, message: developerError(error, "remove") };
  }
}
