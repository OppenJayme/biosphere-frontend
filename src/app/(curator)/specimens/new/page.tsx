import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SpecimenRecordForm } from "@/components/specimens/SpecimenRecordForm";
import { listActiveStorageUnits } from "@/features/specimen-lots/api";
import { buildAssignableStorageUnitOptions } from "@/features/specimen-lots/types";
import { listCollections } from "@/features/specimens/api";
import { EMPTY_RECORD_FORM_VALUES } from "@/features/specimens/record-form";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "New Specimen",
};

export default async function NewSpecimenPage() {
  if (!(await verifySession())) redirect("/login?from=/specimens/new");

  let collections;
  let storageUnits;
  try {
    [collections, storageUnits] = await Promise.all([
      listCollections(),
      listActiveStorageUnits().then(buildAssignableStorageUnitOptions),
    ]);
  } catch {
    return (
      <div className="space-y-5">
        <Link href="/specimens" className="text-sm font-semibold text-forest-800 hover:underline">
          ← Back to specimen catalog
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">The specimen form could not be prepared.</p>
          <p className="mt-1 text-amber-900">
            Collections or storage locations are unavailable, so nothing was saved. Check your
            connection and try again.
          </p>
          <Link
            href="/specimens/new"
            className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/specimens" className="text-sm font-semibold text-forest-800 hover:underline">
        ← Back to specimen catalog
      </Link>
      <header>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">New specimen</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Fill in what you have. Save it as a draft at any point, or catalog it in one step once
          the checklist is complete.
        </p>
      </header>
      <SpecimenRecordForm
        mode="create"
        hasActiveLot={false}
        collections={collections}
        storageUnits={storageUnits}
        initialValues={{ ...EMPTY_RECORD_FORM_VALUES }}
      />
    </div>
  );
}
