/** Authenticated Server Actions for the restricted Developer interface (SRS 4.2). */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import {
  activateArAsset,
  deactivateArAsset,
  onboardCurator,
  removeArAsset,
  updateCuratorStatus,
} from "./api";
import {
  firstValidationMessage,
  readArAssetActivateForm,
  readCuratorStatusForm,
  readOnboardCuratorForm,
  type ArAssetCommandState,
  type CuratorStatusFormState,
  type OnboardFormState,
} from "./form";
import { getDeveloperAccess } from "./session";

type DeveloperOperation = "onboard" | "status" | "activate" | "deactivate" | "remove";

function backendMessage(error: ApiError) {
  const body = error.body;
  return typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
    ? body.message
    : null;
}

function developerError(error: unknown, operation: DeveloperOperation) {
  if (error instanceof ApiError) {
    // AR rule violations (e.g. the exhibit is no longer deployable) are explained by the backend.
    if (error.status === 400 && operation === "activate") {
      return backendMessage(error) ?? "This AR asset cannot be activated right now.";
    }
    if (error.status === 401) return "Your session expired. Sign in and try again.";
    if (error.status === 403) {
      return operation === "status"
        ? "Only curator accounts can be changed from the Developer interface."
        : "Your account is not authorized for restricted developer functions.";
    }
    if (error.status === 404) {
      return operation === "status"
        ? "This curator account no longer exists. Reload the list."
        : "This AR asset no longer exists. Reload the list.";
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

const INVALID_ASSET = "The AR asset identifier is invalid. Reload and try again.";

/** Activation carries the documented authorization, which the backend stores in the audit log. */
export async function activateArAssetAction(
  assetId: string,
  _previousState: ArAssetCommandState,
  formData: FormData,
): Promise<ArAssetCommandState> {
  void _previousState;
  if (!(await requireDeveloper())) return { message: NOT_DEVELOPER };

  const id = z.uuid().safeParse(assetId);
  if (!id.success) return { message: INVALID_ASSET };

  const parsed = readArAssetActivateForm(formData);
  if (!parsed.success) return { message: firstValidationMessage(parsed.error) };

  try {
    await activateArAsset(id.data, parsed.data.authorizationReference);
  } catch (error) {
    return { message: developerError(error, "activate") };
  }

  revalidatePath("/developer");
  return {};
}

export async function deactivateArAssetAction(
  assetId: string,
  _previousState: ArAssetCommandState,
  _formData: FormData,
): Promise<ArAssetCommandState> {
  void _previousState;
  void _formData;
  if (!(await requireDeveloper())) return { message: NOT_DEVELOPER };

  const id = z.uuid().safeParse(assetId);
  if (!id.success) return { message: INVALID_ASSET };

  try {
    await deactivateArAsset(id.data);
  } catch (error) {
    return { message: developerError(error, "deactivate") };
  }

  revalidatePath("/developer");
  return {};
}

export async function removeArAssetAction(
  assetId: string,
  _previousState: ArAssetCommandState,
  _formData: FormData,
): Promise<ArAssetCommandState> {
  void _previousState;
  void _formData;
  if (!(await requireDeveloper())) return { message: NOT_DEVELOPER };

  const id = z.uuid().safeParse(assetId);
  if (!id.success) return { message: INVALID_ASSET };

  try {
    await removeArAsset(id.data);
  } catch (error) {
    return { message: developerError(error, "remove") };
  }

  revalidatePath("/developer");
  return {};
}
