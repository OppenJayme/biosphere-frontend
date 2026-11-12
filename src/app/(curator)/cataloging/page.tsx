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
import { PageHeader, PAGE_ACTION_PRIMARY, PAGE_ACTION_SECONDARY } from "@/components/curator/PageHeader";

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
        <PageHeader
          title="Cataloging"
          description="Continue work on protected Uncataloged specimen records."
        />
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
      <PageHeader
        title="Cataloging"
        description="Search the Uncataloged queue and continue catalog work on live specimen records."
        actions={
          <>
            <Link href="/cataloging/import" className={PAGE_ACTION_SECONDARY}>
              Import from Excel
            </Link>
            <Link href="/specimens" className={PAGE_ACTION_SECONDARY}>
              Full specimen catalog
            </Link>
            <Link href="/specimens/new" className={PAGE_ACTION_PRIMARY}>
              Add specimen draft
            </Link>
          </>
        }
      />

      <LiveCatalogingQueue page={page} query={query} />
    </div>
  );
}
