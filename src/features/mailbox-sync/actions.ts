/** Curator Server Action behind the history's "Check for replies" button (backend spec 0002 AC-1, AC-10). */

"use server";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { refreshPublicWebsiteConsumers, requireCuratorSession } from "../public-submissions/action-helpers";
import { PUBLIC_WEBSITE_PATH } from "../public-submissions/query";
import { runMailboxSync } from "./api";
import { mailboxRunError, mailboxRunMessage } from "./types";

export type CheckRepliesState = { ok?: boolean; message?: string };

function backendMessage(body: unknown) {
  if (!body || typeof body !== "object" || !("message" in body)) return undefined;
  const { message } = body as { message: unknown };
  return typeof message === "string" ? message : undefined;
}

export async function checkVisitorRepliesAction(
  _previousState: CheckRepliesState,
  _formData: FormData,
): Promise<CheckRepliesState> {
  void _previousState;
  void _formData;
  await requireCuratorSession();

  try {
    const result = await runMailboxSync();
    // Imported replies belong to inquiry and visit request histories; reload what shows them.
    refreshPublicWebsiteConsumers();
    return { ok: true, message: mailboxRunMessage(result) };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) redirect(`/login?from=${PUBLIC_WEBSITE_PATH}`);
      return { ok: false, message: mailboxRunError(error.status, backendMessage(error.body)) };
    }
    return { ok: false, message: mailboxRunError(null) };
  }
}
