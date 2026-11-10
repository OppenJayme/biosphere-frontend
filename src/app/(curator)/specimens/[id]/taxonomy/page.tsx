import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { SpecimenTaxonomyForm } from "@/components/specimens/SpecimenTaxonomyForm";
import { getSpecimenDetails } from "@/features/specimens/api";
import { taxonomyToFormValues } from "@/features/specimens/taxonomy-form";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Specimen Taxonomy",
};

type SpecimenTaxonomyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SpecimenTaxonomyPage({ params }: SpecimenTaxonomyPageProps) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!(await verifySession())) {
    redirect(`/login?from=${encodeURIComponent(`/specimens/${id}/taxonomy`)}`);
  }

  let detail;
  try {
    detail = await getSpecimenDetails(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();

    return (
      <div className="space-y-5">
        <Link
          href={`/specimens/${id}`}
          className="text-sm font-semibold text-forest-800 hover:underline"
        >
          ← Back to specimen details
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">The taxonomy editor could not be loaded.</p>
          <p className="mt-1 text-amber-900">
            Existing data has not been changed. Check your connection and try again.
          </p>
          <Link
            href={`/specimens/${id}/taxonomy`}
            className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  if (detail.specimen.status === "ARCHIVED") {
    return (
      <div className="space-y-5">
        <Link
          href={`/specimens/${id}`}
          className="text-sm font-semibold text-forest-800 hover:underline"
        >
          ← Back to specimen details
        </Link>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
          Taxonomy for archived specimen records is read-only and cannot be changed.
        </div>
      </div>
    );
  }

  const mode = detail.taxonomy ? "update" : "create";

  return (
    <div className="space-y-5">
      <Link
        href={`/specimens/${id}`}
        className="text-sm font-semibold text-forest-800 hover:underline"
      >
        ← Back to specimen details
      </Link>
      <header>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">
          {mode === "create" ? "Add specimen taxonomy" : "Edit specimen taxonomy"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Backend audit and revision history will record every confirmed taxonomy change.
        </p>
      </header>
      <SpecimenTaxonomyForm
        specimenId={id}
        mode={mode}
        initialValues={taxonomyToFormValues(detail.taxonomy)}
      />
    </div>
  );
}
