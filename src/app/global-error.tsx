"use client";

import { useEffect } from "react";
import "./globals.css";

// Last-resort fallback for an error thrown by a root layout itself (public, curator, developer or
// login), which the route-group error.tsx files cannot catch. It replaces the whole document, so
// it supplies its own <html> and <body>. It deliberately depends on nothing that could fail the
// same way: no web fonts, no shared chrome, and a plain link rather than client navigation. Like
// the site-wide 404 it names no internal page.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="site flex min-h-full items-center justify-center p-5"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        <title>Something went wrong | BioSphere</title>
        <main role="alert" className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">BioSphere could not load this page</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Something went wrong on our side. Check your connection and try again in a moment.
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            {/* A plain link forces a full page load, which also re-runs the failed layout. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="rounded-lg border border-brand/70 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Museum home
            </a>
            <button
              type="button"
              onClick={() => retry()}
              className="rounded-lg bg-brand-solid px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-solid-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Try again
            </button>
          </div>
          {error.digest && (
            <p className="mt-5 text-xs text-ink-muted">
              Reference code: <span className="font-mono">{error.digest}</span>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
