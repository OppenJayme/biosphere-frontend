import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { SpecimenProvenanceForm } from "@/components/specimens/SpecimenProvenanceForm";
import { getSpecimenDetails } from "@/features/specimens/api";
import { provenanceToFormValues } from "@/features/specimens/provenance-form";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Specimen Provenance",
};

type SpecimenProvenancePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SpecimenProvenancePage({ params }: SpecimenProvenancePageProps) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!(await verifySession())) {
    redirect(`/login?from=${encodeURIComponent(`/specimens/${id}/provenance`)}`);
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
          <p className="font-semibold">The provenance editor could not be loaded.</p>
          <p className="mt-1 text-amber-900">
            Existing data has not been changed. Check your connection and try again.
          </p>
          <Link
            href={`/specimens/${id}/provenance`}
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
          Provenance for archived specimen records is read-only and cannot be changed.
        </div>
      </div>
    );
  }

  const mode = detail.provenance ? "update" : "create";

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
          {mode === "create" ? "Add specimen provenance" : "Edit specimen provenance"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Backend audit and revision history will record every confirmed provenance change.
        </p>
      </header>
      <SpecimenProvenanceForm
        specimenId={id}
        mode={mode}
        initialValues={provenanceToFormValues(detail.provenance)}
      />
    </div>
  );
}
