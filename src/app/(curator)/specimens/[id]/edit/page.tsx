import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { SpecimenCoreForm } from "@/components/specimens/SpecimenCoreForm";
import { getSpecimenDetails, listCollections } from "@/features/specimens/api";
import { specimenToFormValues } from "@/features/specimens/form";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Edit Specimen Core Record",
};

type EditSpecimenPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSpecimenPage({ params }: EditSpecimenPageProps) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!(await verifySession())) {
    redirect(`/login?from=${encodeURIComponent(`/specimens/${id}/edit`)}`);
  }

  let detail;
  let collections;
  try {
    [detail, collections] = await Promise.all([getSpecimenDetails(id), listCollections()]);
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
          <p className="font-semibold">The specimen editor could not be loaded.</p>
          <p className="mt-1 text-amber-900">
            Existing data has not been changed. Check your connection and try again.
          </p>
          <Link
            href={`/specimens/${id}/edit`}
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
          Archived specimen records are read-only and cannot be edited.
        </div>
      </div>
    );
  }

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
          Edit specimen core record
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Changes are recorded by the backend in the protected specimen revision and audit history.
        </p>
      </header>
      <SpecimenCoreForm
        mode="edit"
        specimenId={id}
        collections={collections}
        initialValues={specimenToFormValues(detail.specimen)}
      />
    </div>
  );
}
