import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { SpecimenLotCreationForm } from "@/components/specimens/SpecimenLotCreationForm";
import { listActiveStorageUnits } from "@/features/specimen-lots/api";
import { buildAssignableStorageUnitOptions } from "@/features/specimen-lots/types";
import { getSpecimenDetails } from "@/features/specimens/api";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Add Specimen Lot",
};

type NewSpecimenLotPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewSpecimenLotPage({ params }: NewSpecimenLotPageProps) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!(await verifySession())) {
    redirect(`/login?from=${encodeURIComponent(`/specimens/${id}/lots/new`)}`);
  }

  let detail;
  try {
    detail = await getSpecimenDetails(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();

    return (
      <LoadError specimenId={id} message="The specimen could not be loaded." />
    );
  }

  if (detail.specimen.status === "ARCHIVED") {
    return (
      <div className="space-y-5">
        <BackLink specimenId={id} />
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
          Archived specimen records are read-only and cannot receive new lots.
        </div>
      </div>
    );
  }

  let storageUnits;
  try {
    storageUnits = buildAssignableStorageUnitOptions(await listActiveStorageUnits());
  } catch {
    return (
      <LoadError
        specimenId={id}
        message="Available storage locations could not be loaded."
      />
    );
  }

  const specimenName =
    detail.specimen.accessionNumber ??
    detail.specimen.scientificName ??
    detail.specimen.commonName ??
    "Unnamed specimen";

  return (
    <div className="space-y-5">
      <BackLink specimenId={id} />
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {specimenName}
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-forest-800">
          Add specimen lot
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Assign an initial quantity to its verified physical storage location and condition.
        </p>
      </header>
      <SpecimenLotCreationForm specimenId={id} storageUnits={storageUnits} />
    </div>
  );
}

function BackLink({ specimenId }: { specimenId: string }) {
  return (
    <Link
      href={`/specimens/${specimenId}`}
      className="text-sm font-semibold text-forest-800 hover:underline"
    >
      ← Back to specimen details
    </Link>
  );
}

function LoadError({ specimenId, message }: { specimenId: string; message: string }) {
  return (
    <div className="space-y-5">
      <BackLink specimenId={specimenId} />
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <p className="font-semibold">{message}</p>
        <p className="mt-1 text-amber-900">
          No inventory data was changed. Check your connection and try again.
        </p>
        <Link
          href={`/specimens/${specimenId}/lots/new`}
          className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800"
        >
          Retry
        </Link>
      </div>
    </div>
  );
}
