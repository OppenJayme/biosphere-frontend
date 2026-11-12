/** Authenticated Server Actions for the restricted Developer interface (SRS 4.2). */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import {
  activateArAsset,
  deactivateArAsset,
  handOverCurator,
  onboardCurator,
  removeArAsset,
  resendCuratorInvite,
  updateCuratorStatus,
} from "./api";
import {
  firstValidationMessage,
  readArAssetActivateForm,
  readCuratorHandoverForm,
  readCuratorStatusForm,
  readOnboardCuratorForm,
  type ArAssetCommandState,
  type CuratorHandoverFormState,
  type CuratorStatusFormState,
  type OnboardFormState,
  type ResendInviteFormState,
} from "./form";
import { getDeveloperAccess } from "./session";

type DeveloperOperation = "onboard" | "resend" | "status" | "handover" | "activate" | "deactivate" | "remove";

function backendMessage(error: ApiError) {
  const body = error.body;
  return typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
    ? body.message
    : null;
}

function developerError(error: unknown, operation: DeveloperOperation) {
  if (error instanceof ApiError) {
    // Handover rules (successor not set up yet, account already inactive) are explained by the backend.
    if (operation === "handover" && [400, 404, 409].includes(error.status)) {
      return backendMessage(error) ?? "The handover could not be completed. Reload the list and try again.";
    }
    if (operation === "handover" && error.status >= 500) {
      return "The handover could not be completed. No account was changed. Try again.";
    }
    // Already accepted, inactive, link already opened: the backend says which and what to do.
    if (operation === "resend" && [404, 409, 429].includes(error.status)) {
      return backendMessage(error) ?? "This invitation can no longer be resent. Reload the list.";
    }
    if (operation === "resend" && error.status >= 500) {
      return "The invitation email could not be sent. Try again later.";
    }
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
      return "An account with this email address already exists. If the invitation is still pending, it appears in the list below.";
    }
    if (error.status === 400) {
      return operation === "onboard"
        ? "Check the curator's email address and full name."
        : (backendMessage(error) ?? "The backend rejected this request. Check the values and try again.");
    }
    if (error.status === 429) return "Too many requests. Wait a minute and try again.";
    if (error.status >= 500 && operation === "onboard") {
      // The backend removes a half-created invite, so its message says whether a retry is safe.
      return backendMessage(error) ?? "The onboarding did not finish. Check the curator list before retrying.";
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

/** Emails a new password-setup link while the curator's invitation is still pending (REQ-4.2-02). */
export async function resendCuratorInviteAction(
  curatorId: string,
  _previousState: ResendInviteFormState,
  _formData: FormData,
): Promise<ResendInviteFormState> {
  void _previousState;
  void _formData;
  if (!(await requireDeveloper())) return { message: NOT_DEVELOPER };

  const id = z.uuid().safeParse(curatorId);
  if (!id.success) return { message: "The curator identifier is invalid. Reload and try again." };

  try {
    await resendCuratorInvite(id.data);
  } catch (error) {
    return { message: developerError(error, "resend") };
  }

  revalidatePath("/developer");
  return { success: "A new password-setup link was sent. Earlier links no longer work." };
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

/** Hands a curator's role to a successor who already has their own account (REQ-4.1-09). */
export async function handOverCuratorAction(
  _previousState: CuratorHandoverFormState,
  formData: FormData,
): Promise<CuratorHandoverFormState> {
  void _previousState;
  if (!(await requireDeveloper())) return { message: NOT_DEVELOPER };

  const parsed = readCuratorHandoverForm(formData);
  if (!parsed.success) return { message: firstValidationMessage(parsed.error) };

  let result: Awaited<ReturnType<typeof handOverCurator>>;
  try {
    result = await handOverCurator(parsed.data);
  } catch (error) {
    return { message: developerError(error, "handover") };
  }

  revalidatePath("/developer");
  return {
    success: `Handover recorded. ${result.outgoing.fullName} can no longer sign in, and ${result.successor.fullName} continues as curator.`,
  };
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
