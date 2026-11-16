/*
 * BioSphere's deliberately narrow service worker.
 *
 * Protected HTML, APIs, authentication, and museum data are network-only. The
 * worker caches only immutable same-origin build assets and a record-free
 * offline page; IndexedDB remains the owner-partitioned offline data store.
 */

const CACHE_PREFIX = "biosphere-static-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const OFFLINE_URL = "/offline.html";
const PRE_CACHE_URLS = [OFFLINE_URL, "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE_URLS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

function isCacheableStaticRequest(request, url) {
  if (request.method !== "GET" || url.origin !== self.location.origin) return false;
  return url.pathname.startsWith("/_next/static/") || PRE_CACHE_URLS.includes(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    // Never persist authenticated or personalized HTML. Offline navigations get
    // a generic page containing no museum data or account information.
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await caches.match(OFFLINE_URL);
        return fallback ?? Response.error();
      }),
    );
    return;
  }

  if (!isCacheableStaticRequest(request, url)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;

      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        await cache.put(request, response.clone());
      }
      return response;
    }),
  );
});

/*
 * Push alerts (backend spec 0004). Pushes carry no data, so nothing about a
 * visitor passes through the browser vendor's push service. On a push the
 * worker tells open tabs to refresh the bell, then reads the curator's own
 * feed through the authenticated same-origin route and shows only the alert
 * title and reference code. Signed out or offline, it shows a generic alert.
 */
const PUSH_ALERT_TYPES = ["NEW_INQUIRY", "NEW_VISIT_REQUEST", "VISITOR_REPLY"];
const PUSH_FALLBACK_URL = "/dashboard";
const PUSH_ICON = "/biosphere-logo-512.png";

function pushRecordUrl(item) {
  // Mirrors publicWebsiteHref: inquiries are the default tab.
  const params = new URLSearchParams();
  if (item.recordType === "visit_request") params.set("tab", "visits");
  else if (item.recordType !== "inquiry") return PUSH_FALLBACK_URL;
  params.set("selected", item.recordId);
  return `/public-website?${params.toString()}`;
}

async function newestPushAlert() {
  try {
    const response = await fetch("/api/notifications?limit=20", { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) return null;
    const feed = await response.json();
    const items = Array.isArray(feed?.items) ? feed.items : [];
    return (
      items.find(
        (item) =>
          PUSH_ALERT_TYPES.includes(item?.type) &&
          !item.readAt &&
          typeof item.title === "string" &&
          typeof item.referenceCode === "string" &&
          typeof item.recordId === "string",
      ) ?? null
    );
  } catch {
    return null;
  }
}

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) client.postMessage({ type: "BIOSPHERE_NOTIFICATIONS_CHANGED" });
      // Always show a notification, even with BioSphere in front: Safari (and
      // iOS Home Screen apps) can revoke a subscription after silent pushes.
      // The tag below replaces an earlier alert for the same item.
      const item = await newestPushAlert();
      await self.registration.showNotification("BioSphere", {
        body: item
          ? `${item.title} · Ref ${item.referenceCode}`
          : "New activity is waiting for a curator. Open BioSphere to review it.",
        tag: item ? item.id : "biosphere-activity",
        icon: PUSH_ICON,
        data: { url: item ? pushRecordUrl(item) : PUSH_FALLBACK_URL },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? PUSH_FALLBACK_URL, self.location.origin);
  if (url.origin !== self.location.origin) return;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const existing = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (existing) {
        await existing.focus();
        await existing.navigate(url.href).catch(() => undefined);
        return;
      }
      await self.clients.openWindow(url.href);
    })(),
  );
});
