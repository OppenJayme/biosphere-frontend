/** Protected Cataloging page for maintaining curator-extensible specimen collections. */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CollectionManager } from "@/components/specimens/CollectionManager";
import { searchCollections } from "@/features/specimens/api";
import {
  collectionListHref,
  parseCollectionListQuery,
} from "@/features/specimens/collection-management";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Manage Collections",
};

type CollectionManagementPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CollectionManagementPage({
  searchParams,
}: CollectionManagementPageProps) {
  if (!(await verifySession())) redirect("/login?from=/specimens/collections");

  const params = await searchParams;
  const query = parseCollectionListQuery(params);
  let page;
  try {
    page = await searchCollections(query);
  } catch {
    return (
      <div className="space-y-5">
        <Link href="/specimens" className="text-sm font-semibold text-forest-800 hover:underline">
          &larr; Back to specimen catalog
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">Collections are temporarily unavailable.</p>
          <p className="mt-1 text-amber-900">
            Check your connection and try again. No placeholder collection records are shown.
          </p>
          <Link
            href="/specimens/collections"
            className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800"
          >
            Retry collections
          </Link>
        </div>
      </div>
    );
  }

  // Canonicalize stale/bookmarked page numbers after collection counts change.
  const lastPage = Math.max(1, Math.ceil(page.total / page.limit));
  if (query.page > lastPage) redirect(collectionListHref(query, lastPage));

  const notice = firstValue(params.notice);

  return (
    <div className="space-y-5">
      <Link href="/specimens" className="text-sm font-semibold text-forest-800 hover:underline">
        &larr; Back to specimen catalog
      </Link>
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Cataloging</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-forest-800">
          Manage collections
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Maintain the extensible collection names referenced by specimen records.
        </p>
      </header>

      {(notice === "created" || notice === "renamed") && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          {notice === "created" ? "The collection was added." : "The collection was renamed."}
        </div>
      )}

      <CollectionManager page={page} query={query} />
    </div>
  );
}
