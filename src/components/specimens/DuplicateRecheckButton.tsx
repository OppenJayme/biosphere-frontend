"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * Re-runs the saved-specimen duplicate lookup. A link to the already active URL is not a
 * reliable re-fetch, so this refreshes the current route: Server Components re-render and
 * the uncached GET /specimens/:id/possible-duplicates request runs again.
 */
export function DuplicateRecheckButton() {
  const router = useRouter();
  const [checking, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={checking}
      onClick={() => startTransition(() => router.refresh())}
      className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
    >
      {checking ? "Checking…" : "Check again"}
    </button>
  );
}
