"use client";

import { ExhibitStatePage } from "@/components/exhibits/public/ExhibitStatePage";

// Shown when the exhibit could not be loaded, e.g. the backend is down. Unlike not-found.tsx the
// exhibit may well exist, so the visitor is offered a retry. The error itself is never shown:
// in production Next replaces server error messages with a digest anyway.
export default function ExhibitError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <ExhibitStatePage
      heading="This exhibit could not be loaded"
      action={
        <button
          type="button"
          onClick={() => retry()}
          className="rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-700"
        >
          Try again
        </button>
      }
    >
      <p>We could not reach the museum&apos;s exhibit service. Check your connection and try again in a moment.</p>
      <title>Exhibit unavailable | BioSphere</title>
    </ExhibitStatePage>
  );
}
