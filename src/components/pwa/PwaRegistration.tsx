/** Registers the production service worker and applies updates without stale-tab loops. */

"use client";

import { useEffect } from "react";

export function PwaRegistration() {
  useEffect(() => {
    // Development workers commonly serve stale bundles after code changes. The
    // production build is the supported environment for offline/PWA testing.
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }

    let disposed = false;
    let refreshing = false;

    void import("workbox-window")
      .then(({ Workbox }) => {
        if (disposed) return;

        const workbox = new Workbox("/sw.js", { scope: "/" });

        workbox.addEventListener("waiting", () => {
          workbox.messageSkipWaiting();
        });

        workbox.addEventListener("controlling", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        void workbox.register().catch(() => {
          // PWA support is progressive enhancement. Registration failure must
          // not prevent online cataloging or other primary workflows.
        });
      })
      .catch(() => {
        // Keep the application usable if this optional browser module cannot load.
      });

    return () => {
      disposed = true;
    };
  }, []);

  return null;
}
