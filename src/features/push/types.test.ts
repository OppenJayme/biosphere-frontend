import { describe, expect, it } from "vitest";
import { applicationServerKey, pushSubscriptionRequestSchema, usesServerKey } from "./types";

describe("applicationServerKey", () => {
  it("decodes an unpadded base64url VAPID key to its bytes", () => {
    const bytes = Uint8Array.from({ length: 65 }, (_, index) => (index * 37 + 4) % 256);
    const encoded = Buffer.from(bytes).toString("base64url");
    expect(encoded).not.toContain("=");
    expect(Array.from(applicationServerKey(encoded))).toEqual(Array.from(bytes));
  });
});

describe("pushSubscriptionRequestSchema", () => {
  it("accepts only an https endpoint and nothing else", () => {
    const endpoint = "https://fcm.googleapis.com/fcm/send/device-1";
    expect(pushSubscriptionRequestSchema.safeParse({ endpoint }).success).toBe(true);
    expect(pushSubscriptionRequestSchema.safeParse({ endpoint: "http://fcm.googleapis.com/x" }).success).toBe(false);
    expect(pushSubscriptionRequestSchema.safeParse({ endpoint, accountId: "someone-else" }).success).toBe(false);
    expect(pushSubscriptionRequestSchema.safeParse({ endpoint: `https://x.test/${"a".repeat(1000)}` }).success).toBe(
      false,
    );
  });
});

describe("usesServerKey", () => {
  const key = Uint8Array.from({ length: 65 }, (_, index) => (index * 11 + 4) % 256);
  const encoded = Buffer.from(key).toString("base64url");

  it("matches a subscription made with the current key", () => {
    expect(usesServerKey(key.slice().buffer, encoded)).toBe(true);
  });

  it("detects a subscription made with a rotated key", () => {
    const old = key.slice();
    old[10] ^= 0xff;
    expect(usesServerKey(old.buffer, encoded)).toBe(false);
    expect(usesServerKey(key.slice(0, 64).buffer, encoded)).toBe(false);
  });

  it("does not churn when the browser does not report the key", () => {
    expect(usesServerKey(null, encoded)).toBe(true);
  });
});
