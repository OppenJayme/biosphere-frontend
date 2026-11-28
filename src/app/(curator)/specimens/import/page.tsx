/** Protected entry point for reviewing and committing specimen Excel imports. */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SpecimenImportWorkspace } from "@/components/cataloging/SpecimenImportWorkspace";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = { title: "Import Specimens" };

export default async function SpecimenImportPage() {
  if (!(await verifySession())) redirect("/login?from=/specimens/import");

  return (
    <div className="space-y-5">
      <Link href="/specimens" className="text-sm font-semibold text-forest-800 hover:underline">
        ← Back to specimens
      </Link>
      <header>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Import specimen drafts</h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600">
          Validate an Excel (.xlsx) file, review every result and duplicate warning, then explicitly create selected Uncataloged records.
        </p>
      </header>
      <SpecimenImportWorkspace />
    </div>
  );
}
