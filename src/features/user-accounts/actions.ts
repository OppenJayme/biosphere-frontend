/** Authenticated Server Actions for the curator Users page. */

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { listAuditLogs } from "../audit/api";
import { describeAuditEntry } from "../audit/describe";
import { inviteCurator, resendInvitation } from "./api";
import {
  EMPTY_INVITE_VALUES,
  fieldErrors,
  readInviteCuratorForm,
  type InviteCuratorState,
  type ResendInvitationState,
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

function resendError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session has expired. Sign in again.";
    if (error.status === 403) return "Only active curators can resend invitations.";
    // Already accepted, inactive, link already opened: the backend says which and what to do.
    if (error.status === 404 || error.status === 409) {
      return backendMessage(error) ?? "This invitation can no longer be resent. Reload the page.";
    }
    if (error.status === 429) {
      return backendMessage(error) ?? "Too many requests. Wait a few minutes and try again.";
    }
    if (error.status >= 500) return "The invitation email could not be sent. Try again later.";
  }
  return "The invitation could not be resent. Check your connection and try again.";
}

/** Emails a new password-setup link to a curator whose invitation is still pending (REQ-4.1-07). */
export async function resendInvitationAction(
  accountId: string,
  _previousState: ResendInvitationState,
  _formData: FormData,
): Promise<ResendInvitationState> {
  void _previousState;
  void _formData;
  if (!z.uuid().safeParse(accountId).success) {
    return { message: "Unknown user account." };
  }
  if (!(await verifySession())) {
    return { message: "Your session has expired. Sign in again." };
  }

  let account: Awaited<ReturnType<typeof resendInvitation>>;
  try {
    account = await resendInvitation(accountId);
  } catch (error) {
    return { message: resendError(error) };
  }

  revalidatePath("/users");
  return {
    success: account.email
      ? `A new password-setup link was sent to ${account.email}. Earlier links no longer work.`
      : "A new password-setup link was sent. Earlier links no longer work.",
  };
}
