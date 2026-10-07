/** Cataloging Clear all navigation: keep native links/history while showing pending work. */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ClearSpecimenFiltersLink() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Link
        href="/specimens"
        aria-busy={pending}
        aria-disabled={pending || undefined}
        onNavigate={(event) => {
          // onNavigate excludes modified/new-tab clicks. No JS still follows href.
          event.preventDefault();
          if (pending) return;
          startTransition(() => router.push("/specimens"));
        }}
        className="rounded-lg px-3 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 aria-disabled:cursor-wait"
      >
        {pending ? "Clearing filters…" : "Clear all"}
      </Link>
      {/* Do not reset controls optimistically while the old results are still shown. */}
      {pending && (
        // Navigation is not a mutation: keep other navigation available if the network stalls.
        <span role="status" aria-live="polite" className="self-center text-xs text-zinc-600">
          Loading unfiltered specimen results…
        </span>
      )}
    </>
  );
}
