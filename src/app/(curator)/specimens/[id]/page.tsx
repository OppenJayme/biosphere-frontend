import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { SpecimenFullDetails } from "@/components/specimens/SpecimenFullDetails";
import { SpecimenLifecyclePanel } from "@/components/specimens/SpecimenLifecyclePanel";
import { getSpecimenDetails } from "@/features/specimens/api";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Specimen Details",
};

type SpecimenDetailsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function specimenNotice(params: Record<string, string | string[] | undefined>) {
  const lifecycle = firstValue(params.lifecycle);
  if (lifecycle === "public-enabled") return "The specimen is now eligible for public display.";
  if (lifecycle === "public-disabled") return "Public-display eligibility was removed.";
  if (lifecycle === "archived") return "The specimen was archived and public eligibility was disabled.";
  if (firstValue(params.created) === "1") return "The uncataloged specimen draft was created.";
  if (firstValue(params.updated) === "1") return "The specimen core record was updated.";
  if (firstValue(params.taxonomy) === "created") return "The specimen taxonomy record was created.";
  if (firstValue(params.taxonomy) === "updated") return "The specimen taxonomy record was updated.";
  if (firstValue(params.provenance) === "created") return "The specimen provenance record was created.";
  if (firstValue(params.provenance) === "updated") return "The specimen provenance record was updated.";
  if (firstValue(params.lot) === "created") {
    return "The specimen lot and its initial quantity history were created.";
  }
  return null;
}

export default async function SpecimenDetailsPage({
  params,
  searchParams,
}: SpecimenDetailsPageProps) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const user = await verifySession();
  if (!user) redirect(`/login?from=${encodeURIComponent(`/specimens/${id}`)}`);

  let detail;
  try {
    detail = await getSpecimenDetails(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();

    return (
      <div className="space-y-5">
        <Link href="/specimens" className="text-sm font-semibold text-forest-800 hover:underline">
          ← Back to specimen catalog
        </Link>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">This specimen could not be loaded.</p>
          <p className="mt-1 text-amber-900">
            Check your connection and try again. Existing catalog data was not replaced or changed.
          </p>
        </div>
      </div>
    );
  }

  const title =
    detail.specimen.accessionNumber ??
    detail.specimen.scientificName ??
    detail.specimen.commonName ??
    "Unnamed specimen";
  const noticeParams = await searchParams;
  const savedNotice = specimenNotice(noticeParams);

  return (
    <div className="space-y-5">
      <Link href="/specimens" className="text-sm font-semibold text-forest-800 hover:underline">
        ← Back to specimen catalog
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Specimen record</p>
          <h1 className="mt-1 font-serif text-2xl font-semibold text-forest-800">{title}</h1>
          {(detail.specimen.commonName || detail.specimen.scientificName) && (
            <p className="mt-1 text-sm text-zinc-600">
              {[detail.specimen.commonName, detail.specimen.scientificName]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/specimens/${id}/history`}
            className="rounded-lg border border-black/15 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Revision history
          </Link>
          {detail.specimen.status !== "ARCHIVED" && (
            <Link
              href={`/specimens/${id}/edit`}
              className="rounded-lg border border-forest-700 px-3 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50"
            >
              Edit core record
            </Link>
          )}
          <span className="rounded-full bg-forest-100 px-3 py-1.5 text-xs font-semibold text-forest-800">
            {detail.specimen.status}
          </span>
        </div>
      </header>

      {savedNotice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          {savedNotice}
        </div>
      )}

      <SpecimenLifecyclePanel
        specimen={detail.specimen}
        activeLotCount={detail.lotOverview.activeLotCount}
      />

      <SpecimenFullDetails detail={detail} />
    </div>
  );
}
