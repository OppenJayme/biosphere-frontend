/** Authenticated Server Actions for the curator Users page. */

"use server";

import { z } from "zod";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { listAuditLogs } from "../audit/api";
import type { RecentActivityResult } from "./types";
import { formatDateTime, humanizeAction } from "./view";

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
    return {
      status: "ok",
      items: page.items.map((item) => ({
        id: item.id,
        description: item.affectedRecordType
          ? `${humanizeAction(item.action)} · ${humanizeAction(item.affectedRecordType)}`
          : humanizeAction(item.action),
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
