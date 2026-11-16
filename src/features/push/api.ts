/** Server-only client for the backend push endpoints. */

import "server-only";
import { z } from "zod";
import { apiFetch } from "@/lib/api-client";
import { parseResponse as parse } from "../public-submissions/parse";
import { pushConfigSchema, type PushConfig, type PushSubscriptionRequest } from "./types";

export async function getPushConfig(): Promise<PushConfig> {
  const response = await apiFetch<unknown>("/push/config", { method: "GET", cache: "no-store" });
  return parse(pushConfigSchema, response, "push configuration");
}

export async function subscribePush(input: PushSubscriptionRequest) {
  const response = await apiFetch<unknown>("/push/subscriptions", {
    method: "POST",
    body: JSON.stringify(input),
    cache: "no-store",
  });
  return parse(z.object({ subscribed: z.literal(true) }), response, "push registration");
}

export async function unsubscribePush(input: PushSubscriptionRequest) {
  const response = await apiFetch<unknown>("/push/subscriptions", {
    method: "DELETE",
    body: JSON.stringify(input),
    cache: "no-store",
  });
  return parse(z.object({ subscribed: z.literal(false) }), response, "push removal");
}
