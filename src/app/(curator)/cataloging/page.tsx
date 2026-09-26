/** Protected Cataloging queue backed by live Uncataloged specimen records. */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LiveCatalogingQueue } from "@/components/cataloging/LiveCatalogingQueue";
import { searchSpecimens } from "@/features/specimens/api";
import {
  catalogingQueueHref,
  parseCatalogingQueueQuery,
  toSpecimenListQuery,
} from "@/features/specimens/cataloging-queue";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Cataloging Queue",
};

type CatalogingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CatalogingPage({ searchParams }: CatalogingPageProps) {
  if (!(await verifySession())) redirect("/login?from=/cataloging");

  const query = parseCatalogingQueueQuery(await searchParams);
  let page;
  try {
    page = await searchSpecimens(toSpecimenListQuery(query));
  } catch {
    return (
      <div className="space-y-5">
        <header>
          <h1 className="font-serif text-2xl font-semibold text-forest-800">
            Cataloging queue
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Continue work on protected Uncataloged specimen records.
          </p>
        </header>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">The Cataloging queue is temporarily unavailable.</p>
          <p className="mt-1 text-amber-900">
            Check your connection and try again. No placeholder specimen records are shown.
          </p>
          <Link
            href="/cataloging"
            className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800"
          >
            Retry queue
          </Link>
        </div>
      </div>
    );
  }

  // Keep stale bookmarks inside the valid result range after the queue changes.
  const lastPage = Math.max(1, Math.ceil(page.total / page.limit));
  if (query.page > lastPage) redirect(catalogingQueueHref(query, lastPage));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Cataloging</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-forest-800">
            Uncataloged queue
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Search and continue verified catalog work using live specimen records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/cataloging/import"
            className="rounded-lg border border-forest-700 px-4 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50"
          >
            Import CSV
          </Link>
          <Link
            href="/specimens"
            className="rounded-lg border border-forest-700 px-4 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50"
          >
            Full specimen catalog
          </Link>
          <Link
            href="/specimens/new"
            className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Add specimen draft
          </Link>
        </div>
      </header>

      <LiveCatalogingQueue page={page} query={query} />
    </div>
  );
}
