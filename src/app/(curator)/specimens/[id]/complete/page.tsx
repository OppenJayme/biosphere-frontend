import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { SpecimenRecordForm } from "@/components/specimens/SpecimenRecordForm";
import { listActiveStorageUnits } from "@/features/specimen-lots/api";
import { buildAssignableStorageUnitOptions } from "@/features/specimen-lots/types";
import { getSpecimenDetails, listCollections } from "@/features/specimens/api";
import { specimenToFormValues } from "@/features/specimens/form";
import { provenanceToFormValues } from "@/features/specimens/provenance-form";
import { EMPTY_RECORD_FORM_VALUES } from "@/features/specimens/record-form";
import { taxonomyToFormValues } from "@/features/specimens/taxonomy-form";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Complete Specimen Record",
};

type CompleteSpecimenPageProps = {
  params: Promise<{ id: string }>;
};

/** Every section of an Uncataloged record on one page, from the checklist's "Fix" links. */
export default async function CompleteSpecimenPage({ params }: CompleteSpecimenPageProps) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!(await verifySession())) redirect(`/login?from=${encodeURIComponent(`/specimens/${id}/complete`)}`);

  let detail;
  let collections;
  let storageUnits;
  try {
    [detail, collections, storageUnits] = await Promise.all([
      getSpecimenDetails(id),
      listCollections(),
      listActiveStorageUnits().then(buildAssignableStorageUnitOptions),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    return (
      <div className="space-y-5">
        <BackLink specimenId={id} />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">The record could not be loaded.</p>
          <p className="mt-1 text-amber-900">Nothing was changed. Check your connection and try again.</p>
          <Link
            href={`/specimens/${id}/complete`}
            className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  // Cataloged and archived records keep their own edit pages and guards.
  if (detail.specimen.status !== "UNCATALOGED") redirect(`/specimens/${id}`);

  const activeLotCount = detail.lotOverview.activeLotCount;
  const title = detail.specimen.commonName ?? detail.specimen.accessionNumber ?? "Unnamed specimen";

  return (
    <div className="space-y-5">
      <BackLink specimenId={id} />
      <header>
        <p className="text-sm text-zinc-500">{title}</p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-forest-800">Complete this record</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Every section is on this page. Fill in what is missing, then save it as a draft or
          catalog it in one step.
        </p>
      </header>
      <SpecimenRecordForm
        mode="complete"
        specimenId={id}
        hasActiveLot={activeLotCount > 0}
        activeLotCount={activeLotCount}
        collections={collections}
        storageUnits={storageUnits}
        initialValues={{
          ...EMPTY_RECORD_FORM_VALUES,
          ...specimenToFormValues(detail.specimen),
          ...taxonomyToFormValues(detail.taxonomy),
          ...provenanceToFormValues(detail.provenance),
        }}
      />
    </div>
  );
}

function BackLink({ specimenId }: { specimenId: string }) {
  return (
    <Link href={`/specimens/${specimenId}`} className="text-sm font-semibold text-forest-800 hover:underline">
      ← Back to specimen details
    </Link>
  );
}
