/** Authenticated Server Actions for the curator Users page. */

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { listAuditLogs } from "../audit/api";
import { describeAuditEntry } from "../audit/describe";
import { handOver, inviteCurator, updateCuratorStatus } from "./api";
import {
  EMPTY_INVITE_VALUES,
  fieldErrors,
  readCuratorStatusForm,
  readHandoverForm,
  readInviteCuratorForm,
  type CuratorStatusState,
  type HandoverState,
  type InviteCuratorState,
} from "./form";
import type { RecentActivityResult } from "./types";
import { formatDateTime } from "./view";
import { resolveAuditRecordLabels } from "../audit/record-labels";
import { labelFor } from "../audit/label-key";

const RECENT_ACTIVITY_LIMIT = 5;

export async function getUserRecentActivity(accountId: string): Promise<RecentActivityResult> {
  if (!z.uuid().safeParse(accountId).success) {
    return { status: "error", message: "Unknown user account." };
  }
  if (!(await verifySession())) {
    return { status: "error", message: "Your session has expired. Sign in again." };
  }

  try {
    const page = await listAuditLogs({ page: 1, limit: RECENT_ACTIVITY_LIMIT, actorId: accountId });
    const labels = await resolveAuditRecordLabels(page.items).catch(() => ({}));
    return {
      status: "ok",
      items: page.items.map((item) => ({
        id: item.id,
        description: describeAuditEntry(item, labelFor(labels, item)),
        timestamp: formatDateTime(item.createdAt),
        failed: item.result !== "SUCCESS",
      })),
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { status: "error", message: "Your session has expired. Sign in again." };
    }
    return { status: "error", message: "Recent activity is unavailable right now." };
  }
}

function backendMessage(error: ApiError) {
  const body = error.body;
  return typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
    ? body.message
    : null;
}

function inviteError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session has expired. Sign in again.";
    if (error.status === 403) return "Only active curators can invite curators.";
    if (error.status === 409) return "An account with this email address already exists.";
    if (error.status === 400) return "Check the curator's full name and email address.";
    if (error.status === 429) return "Too many requests. Wait a minute and try again.";
    if (error.status === 503) return "The invitation email could not be sent. Try again later.";
    // The backend removes a half-created invite, so its message says whether a retry is safe.
    if (error.status >= 500) return backendMessage(error) ?? "The invitation could not be completed. Try again.";
  }
  return "The invitation could not be sent. Check your connection and try again.";
}

function curatorStatusError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session has expired. Sign in again.";
    // Either the curator's own account or an actor who was just deactivated; the backend says which.
    if (error.status === 403) return backendMessage(error) ?? "You cannot make this change.";
    if (error.status === 404) return "This curator account no longer exists. Reload the page.";
    if (error.status === 409) return "This account changed while saving. Reload the page and try again.";
    if (error.status === 400) return "Check the reason and try again.";
    if (error.status === 429) return "Too many requests. Wait a minute and try again.";
    if (error.status >= 500) return "The account status could not be changed. Try again.";
  }
  return "The account status could not be changed. Check your connection and try again.";
}

/** A curator activates or deactivates another curator (REQ-4.1-08). */
export async function updateCuratorStatusAction(
  _previousState: CuratorStatusState,
  formData: FormData,
): Promise<CuratorStatusState> {
  void _previousState;
  const { reason, name, target, parsedReason } = readCuratorStatusForm(formData);
  if (!(await verifySession())) {
    return { reason, message: "Your session has expired. Sign in again." };
  }
  if (!target.success) {
    return { reason, message: "This account could not be changed. Reload the page and try again." };
  }
  if (!parsedReason.success) return { reason, error: parsedReason.error.issues[0].message };

  try {
    await updateCuratorStatus(target.data.accountId, { status: target.data.status, reason: parsedReason.data });
  } catch (error) {
    return { reason, message: curatorStatusError(error) };
  }

  revalidatePath("/users");
  return {
    reason: "",
    success: `${name} ${target.data.status === "INACTIVE" ? "can no longer sign in" : "can sign in again"}.`,
  };
}

function handoverError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session has expired. Sign in again.";
    if (error.status === 403) return backendMessage(error) ?? "Your account can no longer hand over.";
    if (error.status === 404) return "That curator account no longer exists. Reload the page.";
    // Successor not active or not set up yet; the backend says which.
    if (error.status === 409) return backendMessage(error) ?? "Choose an active curator as your successor.";
    if (error.status === 400) return backendMessage(error) ?? "Check the successor and reason, then try again.";
    if (error.status === 429) return "Too many requests. Wait a minute and try again.";
  }
  return "The handover could not be completed. Check your connection and try again.";
}

/**
 * The signed-in curator hands over to a successor (REQ-4.1-09). On success their own account is
 * inactive, so the backend refuses every later request and the dialog only offers signing out.
 */
export async function handOverAction(
  _previousState: HandoverState,
  formData: FormData,
): Promise<HandoverState> {
  void _previousState;
  const { successorAccountId, reason, parsedSuccessor, parsedReason } = readHandoverForm(formData);
  if (!(await verifySession())) {
    return { successorAccountId, reason, message: "Your session has expired. Sign in again." };
  }
  if (!parsedSuccessor.success || !parsedReason.success) {
    return {
      successorAccountId,
      reason,
      errors: {
        successorAccountId: parsedSuccessor.success ? undefined : "Choose your successor.",
        reason: parsedReason.success ? undefined : parsedReason.error.issues[0].message,
      },
    };
  }

  try {
    await handOver({ successorAccountId: parsedSuccessor.data, reason: parsedReason.data });
  } catch (error) {
    return { successorAccountId, reason, message: handoverError(error) };
  }

  revalidatePath("/users");
  return {
    successorAccountId: "",
    reason: "",
    success: "Handover recorded. Your account is now inactive and kept for the records.",
  };
}

/** A curator invites another curator (REQ-4.1-07); the backend emails the password-setup link. */
export async function inviteCuratorAction(
  _previousState: InviteCuratorState,
  formData: FormData,
): Promise<InviteCuratorState> {
  void _previousState;
  const { values, result } = readInviteCuratorForm(formData);
  if (!(await verifySession())) {
    return { values, message: "Your session has expired. Sign in again." };
  }
  if (!result.success) return { values, errors: fieldErrors(result.error) };

  try {
    await inviteCurator(result.data);
  } catch (error) {
    return { values, message: inviteError(error) };
  }

  revalidatePath("/users");
  return {
    values: EMPTY_INVITE_VALUES,
    success: `A password-setup invitation was sent to ${result.data.email}.`,
  };
}
