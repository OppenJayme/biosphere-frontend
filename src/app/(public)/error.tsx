"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

// Catches an unexpected error on a public page, inside the public header and footer. It matches
// the site-wide 404 (app/global-not-found.tsx). QR exhibit pages keep their own compact
// exhibits/[slug]/error.tsx. The error message is never shown to visitors.
export default function PublicError({
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
    <section role="alert" className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 lg:py-32">
      <title>Something went wrong | BioSphere</title>
      <p className="font-mono text-xs tracking-wide text-brand">Something went wrong</p>
      <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-balance text-ink sm:text-6xl">
        This page could not be loaded
      </h1>
      <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink-muted">
        We ran into a problem on our side. Check your connection and try again, or head back to the
        museum home page.
      </p>
      <div className="mt-9 flex flex-wrap gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <Button href="/" variant="outline-forest">
          Museum home
        </Button>
      </div>
    </section>
  );
}
