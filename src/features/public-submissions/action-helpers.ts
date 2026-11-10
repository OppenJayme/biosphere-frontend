/** Shared plumbing for the curator inquiry / visit-request Server Actions. */

import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { curatorActionError, type CuratorOperation } from "./errors";
import {
  PUBLIC_WEBSITE_PATH,
  parsePublicWebsiteQuery,
  publicWebsiteHref,
  type ReturnQuery,
  type WebsiteTab,
} from "./query";

export type { ReturnQuery };

export async function requireCuratorSession() {
  if (!(await verifySession())) redirect(`/login?from=${PUBLIC_WEBSITE_PATH}`);
}

/**
 * Bound arguments arrive from the client, so re-parse them like any URL input before redirecting.
 * `tab` is forced when an action moves the curator to the other list (e.g. after a referral).
 */
export function returnHref(
  returnQuery: ReturnQuery,
  extras: { selected: string; notice: string; tab?: WebsiteTab; email?: string },
) {
  // Filters belong to the list they were set on, so they are dropped when the action switches tabs.
  const sameTab = !extras.tab || extras.tab === returnQuery?.tab;
  const query = parsePublicWebsiteQuery({
    tab: extras.tab ?? returnQuery?.tab,
    ...(sameTab && {
      status: returnQuery?.status,
      search: returnQuery?.search,
      submittedFrom: returnQuery?.submittedFrom,
      submittedTo: returnQuery?.submittedTo,
      visitDateFrom: returnQuery?.visitDateFrom,
      visitDateTo: returnQuery?.visitDateTo,
    }),
  });
  return publicWebsiteHref(query, { selected: extras.selected, notice: extras.notice, email: extras.email });
}

export function actionErrorMessage(error: unknown, operation: CuratorOperation) {
  if (error instanceof ApiError && error.status === 401) {
    redirect(`/login?from=${PUBLIC_WEBSITE_PATH}`);
  }
  return curatorActionError(error instanceof ApiError ? { status: error.status, body: error.body } : null, operation);
}

export function refreshPublicWebsiteConsumers() {
  revalidatePath(PUBLIC_WEBSITE_PATH);
  revalidatePath("/dashboard");
  revalidatePath("/audit-logs");
}
