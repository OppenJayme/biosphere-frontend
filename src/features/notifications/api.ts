/** Server-only client for the curator notification feed. */

import "server-only";
import { apiFetch } from "@/lib/api-client";
import { parseResponse as parse } from "../public-submissions/parse";
import { notificationFeedSchema, type NotificationFeed } from "./types";

export async function getNotifications(limit = 20): Promise<NotificationFeed> {
  const response = await apiFetch<unknown>(`/notifications?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
  });
  return parse(notificationFeedSchema, response, "notification feed");
}
