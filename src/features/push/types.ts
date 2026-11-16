/** Web Push for curator alerts (backend spec 0004). Pushes carry no data; see public/sw.js. */

import { z } from "zod";

export const PUSH_ENDPOINT_MAX = 1000;

export const pushConfigSchema = z.object({
  enabled: z.boolean(),
  publicKey: z.string().min(1).nullable(),
});
export type PushConfig = z.infer<typeof pushConfigSchema>;

/** Only the endpoint goes to the backend: no encryption keys are needed for data-free pushes. */
export const pushSubscriptionRequestSchema = z.strictObject({
  endpoint: z.url({ protocol: /^https$/ }).max(PUSH_ENDPOINT_MAX),
});
export type PushSubscriptionRequest = z.infer<typeof pushSubscriptionRequestSchema>;

/** PushManager.subscribe wants the VAPID public key as bytes; the backend sends base64url. */
export function applicationServerKey(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/**
 * Whether a browser subscription was made with the server's current VAPID public key. After a
 * key rotation the old subscription can never receive a push, so the page re-subscribes.
 * A browser that does not report the key is assumed to match rather than churned on every load.
 */
export function usesServerKey(subscriptionKey: ArrayBuffer | null, serverKey: string): boolean {
  if (!subscriptionKey) return true;
  const current = applicationServerKey(serverKey);
  const existing = new Uint8Array(subscriptionKey);
  return existing.length === current.length && existing.every((byte, index) => byte === current[index]);
}
