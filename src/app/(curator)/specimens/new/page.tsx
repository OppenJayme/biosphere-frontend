import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SpecimenCoreForm } from "@/components/specimens/SpecimenCoreForm";
import { listCollections } from "@/features/specimens/api";
import { EMPTY_SPECIMEN_FORM_VALUES } from "@/features/specimens/form";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "New Specimen Draft",
};

export default async function NewSpecimenPage() {
  if (!(await verifySession())) redirect("/login?from=/specimens/new");

  let collections;
  try {
    collections = await listCollections();
  } catch {
    return (
      <div className="space-y-5">
        <Link href="/specimens" className="text-sm font-semibold text-forest-800 hover:underline">
          ← Back to specimen catalog
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">The specimen form could not be prepared.</p>
          <p className="mt-1 text-amber-900">
            Collection data is unavailable, so no incomplete selection will be submitted. Check
            your connection and try again.
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
        <h1 className="font-serif text-2xl font-semibold text-forest-800">
          Create specimen draft
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Start an uncataloged core record. Catalog completion remains a separate controlled step.
        </p>
      </header>
      <SpecimenCoreForm
        mode="create"
        collections={collections}
        initialValues={{ ...EMPTY_SPECIMEN_FORM_VALUES }}
      />
    </div>
  );
}
