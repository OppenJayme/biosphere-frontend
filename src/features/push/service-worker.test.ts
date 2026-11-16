import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

// Runs the real public/sw.js in a sandbox with a fake worker global, so the push
// handlers are tested as shipped (the file is plain JavaScript, not bundled).
const SOURCE = readFileSync(join(process.cwd(), "public", "sw.js"), "utf8");
const ORIGIN = "https://biosphere.test";
const VISIT_ID = "11111111-1111-4111-8111-111111111111";

type Client = {
  url: string;
  visibilityState: string;
  focused: boolean;
  postMessage: ReturnType<typeof vi.fn>;
  focus: ReturnType<typeof vi.fn>;
  navigate: ReturnType<typeof vi.fn>;
};

function client(overrides: Partial<Client> = {}): Client {
  return {
    url: `${ORIGIN}/dashboard`,
    visibilityState: "hidden",
    focused: false,
    postMessage: vi.fn(),
    focus: vi.fn(() => Promise.resolve()),
    navigate: vi.fn(() => Promise.resolve()),
    ...overrides,
  };
}

function load(windows: Client[], feed: Response | Error) {
  const handlers: Record<string, (event: unknown) => void> = {};
  const showNotification = vi.fn<(title: string, options: unknown) => Promise<void>>(() => Promise.resolve());
  const openWindow = vi.fn(() => Promise.resolve());
  const fetcher = vi.fn(() => (feed instanceof Error ? Promise.reject(feed) : Promise.resolve(feed.clone())));
  const self = {
    addEventListener: (type: string, handler: (event: unknown) => void) => (handlers[type] = handler),
    location: new URL(ORIGIN),
    clients: { matchAll: vi.fn(() => Promise.resolve(windows)), openWindow, claim: vi.fn() },
    registration: { showNotification },
    skipWaiting: vi.fn(),
  };
  runInNewContext(SOURCE, { self, caches: {}, fetch: fetcher, URL, URLSearchParams, Response, Promise, Array, console });

  async function dispatch(type: string, extra: Record<string, unknown> = {}) {
    let pending: Promise<unknown> = Promise.resolve();
    handlers[type]({ ...extra, waitUntil: (promise: Promise<unknown>) => (pending = promise) });
    await pending;
  }
  return { dispatch, showNotification, openWindow, fetcher };
}

const feed = (items: unknown[]) => Response.json({ items });
const replyAlert = {
  id: `VISITOR_REPLY:22222222-2222-4222-8222-222222222222`,
  type: "VISITOR_REPLY",
  title: "A visitor replied by email",
  recordType: "visit_request",
  recordId: VISIT_ID,
  referenceCode: "11111111",
  createdAt: "2026-11-16T10:26:02.000Z",
  readAt: null,
};

describe("service worker push", () => {
  it("shows the newest pushable alert by title and reference only, and refreshes open tabs", async () => {
    const tab = client();
    const sw = load([tab], feed([{ ...replyAlert, type: "LOT_MOVED", recordType: "specimen" }, replyAlert]));
    await sw.dispatch("push");

    expect(tab.postMessage).toHaveBeenCalledWith({ type: "BIOSPHERE_NOTIFICATIONS_CHANGED" });
    expect(sw.fetcher).toHaveBeenCalledWith("/api/notifications?limit=20", expect.objectContaining({ cache: "no-store" }));
    expect(sw.showNotification).toHaveBeenCalledWith("BioSphere", {
      body: "A visitor replied by email · Ref 11111111",
      tag: replyAlert.id,
      icon: "/biosphere-logo-512.png",
      data: { url: `/public-website?tab=visits&selected=${VISIT_ID}` },
    });
  });

  it("links an inquiry alert to the default Public Website tab", async () => {
    const sw = load([], feed([{ ...replyAlert, type: "NEW_INQUIRY", recordType: "inquiry" }]));
    await sw.dispatch("push");
    expect(sw.showNotification.mock.calls[0][1]).toMatchObject({
      data: { url: `/public-website?selected=${VISIT_ID}` },
    });
  });

  it("shows a generic alert when signed out or offline", async () => {
    for (const response of [new Response(null, { status: 401 }), new Error("offline")]) {
      const sw = load([], response);
      await sw.dispatch("push");
      expect(sw.showNotification).toHaveBeenCalledWith(
        "BioSphere",
        expect.objectContaining({ tag: "biosphere-activity", data: { url: "/dashboard" } }),
      );
    }
  });

  it("skips the system alert while a BioSphere tab is in front", async () => {
    const tab = client({ visibilityState: "visible", focused: true });
    const sw = load([tab], feed([replyAlert]));
    await sw.dispatch("push");
    expect(tab.postMessage).toHaveBeenCalled();
    expect(sw.showNotification).not.toHaveBeenCalled();
  });

  it("opens the record in an existing tab, or a new one", async () => {
    const tab = client();
    const notification = { close: vi.fn(), data: { url: `/public-website?tab=visits&selected=${VISIT_ID}` } };
    const sw = load([tab], feed([]));
    await sw.dispatch("notificationclick", { notification });
    expect(notification.close).toHaveBeenCalled();
    expect(tab.focus).toHaveBeenCalled();
    expect(tab.navigate).toHaveBeenCalledWith(`${ORIGIN}/public-website?tab=visits&selected=${VISIT_ID}`);

    const empty = load([], feed([]));
    await empty.dispatch("notificationclick", { notification });
    expect(empty.openWindow).toHaveBeenCalledWith(`${ORIGIN}/public-website?tab=visits&selected=${VISIT_ID}`);
  });

  it("never opens another origin", async () => {
    const sw = load([], feed([]));
    const notification = { close: vi.fn(), data: { url: "https://evil.test/phish" } };
    sw.dispatch("notificationclick", { notification }).catch(() => undefined);
    await Promise.resolve();
    expect(sw.openWindow).not.toHaveBeenCalled();
  });
});
