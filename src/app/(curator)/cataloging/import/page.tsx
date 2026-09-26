/** Protected entry point for reviewing and committing specimen CSV imports. */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SpecimenImportWorkspace } from "@/components/cataloging/SpecimenImportWorkspace";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = { title: "Import Specimens" };

export default async function SpecimenImportPage() {
  if (!(await verifySession())) redirect("/login?from=/cataloging/import");

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Cataloging</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-forest-800">Import specimen drafts</h1>
          <p className="mt-1 max-w-3xl text-sm text-zinc-600">
            Validate a CSV, review every result and duplicate warning, then explicitly create selected Uncataloged core records.
          </p>
        </div>
        <Link href="/cataloging" className="rounded-lg border border-forest-700 px-4 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50">Back to queue</Link>
      </header>
      <SpecimenImportWorkspace />
    </div>
  );
}
