/** Server-only client for the curator notification feed. */

import "server-only";
import { z } from "zod";
import { apiFetch } from "@/lib/api-client";
import { parseResponse as parse } from "../public-submissions/parse";
import {
  notificationFeedSchema,
  type NotificationFeed,
  type NotificationStateRequest,
} from "./types";

export async function getNotifications(limit = 20): Promise<NotificationFeed> {
  const response = await apiFetch<unknown>(`/notifications?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
  });
  return parse(notificationFeedSchema, response, "notification feed");
}

export async function updateNotificationState(input: NotificationStateRequest) {
  const response = await apiFetch<unknown>("/notifications/state", {
    method: "PATCH",
    body: JSON.stringify(input),
    cache: "no-store",
  });
  return parse(
    z.object({ updated: z.literal(true) }),
    response,
    "notification update",
  );
}
