"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";

/**
 * Fallback card for the signed-in route error boundaries (curator, developer, login).
 *
 * The thrown error's message is never rendered: in production Next replaces server error
 * messages with a generic one, and a client error message is not written for curators. Only the
 * digest is shown, as a reference that can be matched to the server log.
 *
 * The boundary also catches a failed server action, so the copy must not claim that nothing was
 * saved.
 */
export function WorkspaceError({
  error,
  retry,
  title,
  children,
  homeHref,
  homeLabel,
}: {
  error: Error & { digest?: string };
  retry: () => void;
  /** Also used as the browser tab title. */
  title: string;
  children: ReactNode;
  homeHref: string;
  homeLabel: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section
      role="alert"
      aria-labelledby="workspace-error-heading"
      className="mx-auto max-w-xl rounded-xl border border-black/10 bg-white p-8 text-center"
    >
      <title>{`${title} | BioSphere`}</title>
      <h1 id="workspace-error-heading" className="font-serif text-2xl font-semibold text-forest-800">
        {title}
      </h1>
      <div className="mx-auto mt-2 max-w-lg space-y-2 text-sm leading-relaxed text-zinc-600">{children}</div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
        <Link
          href={homeHref}
          className="rounded-lg border border-forest-700 bg-white px-4 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
        >
          {homeLabel}
        </Link>
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
        >
          Try again
        </button>
      </div>
      {error.digest && (
        <p className="mt-5 text-xs text-zinc-500">
          Reference code: <span className="font-mono">{error.digest}</span>
        </p>
      )}
    </section>
  );
}
