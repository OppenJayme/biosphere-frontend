import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

// Allow this computer's exact private LAN hosts to load development chunks.
// No wildcard origins; Next applies this option only to the development server.
const privateLanHosts = Object.values(networkInterfaces()).flatMap((interfaces) =>
  (interfaces ?? [])
    .filter(
      (address) =>
        address.family === "IPv4" &&
        !address.internal &&
        /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address.address),
    )
    .map((address) => address.address),
);

const nextConfig: NextConfig = {
  // Local only: also allow the localhost.run tunnel.
  allowedDevOrigins: [...new Set(privateLanHosts), "*.lhr.life"],
  experimental: {
    // The app has several root layouts (public, curator, developer, login), so a site-wide 404
    // lives in src/app/global-not-found.tsx, which this flag enables.
    globalNotFound: true,
    // Curator pages render per request, and Next keeps none of them in the client
    // cache by default, so switching Dashboard -> Specimen -> Dashboard refetched
    // every page and showed loading.tsx each time. Reuse a visited page for 30s.
    // Server actions that call revalidatePath/refresh still purge it, so a
    // curator's own edits show immediately; changes made elsewhere appear once
    // the 30s window expires.
    staleTimes: {
      dynamic: 30,
    },
  },
  images: {
    remotePatterns: [new URL("https://images.unsplash.com/**")],
  },
  async headers() {
    return [
      {
        // A service worker must be revalidated so deployments cannot leave an
        // obsolete caching policy controlling the application indefinitely.
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          { key: "Service-Worker-Allowed", value: "/" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
