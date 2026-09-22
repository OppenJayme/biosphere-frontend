import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { SpecimenRevisionHistory } from "@/components/specimens/SpecimenRevisionHistory";
import {
  getSpecimen,
  getSpecimenRevisionHistory,
} from "@/features/specimens/api";
import {
  parseSpecimenRevisionQuery,
  specimenRevisionHistoryHref,
} from "@/features/specimens/revision-history";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Specimen Revision History",
};

type SpecimenRevisionHistoryPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SpecimenRevisionHistoryPage({
  params,
  searchParams,
}: SpecimenRevisionHistoryPageProps) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  if (!(await verifySession())) {
    redirect(`/login?from=${encodeURIComponent(`/specimens/${id}/history`)}`);
  }

  const query = parseSpecimenRevisionQuery(await searchParams);
  let specimen;
  let history;
  try {
    // These protected reads are independent, so start them together to avoid a request waterfall.
    [specimen, history] = await Promise.all([
      getSpecimen(id),
      getSpecimenRevisionHistory(id, query),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();

    return (
      <div className="space-y-5">
        <BackLink specimenId={id} />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">The specimen revision history could not be loaded.</p>
          <p className="mt-1 text-amber-900">
            Check your connection and try again. No specimen data was changed.
          </p>
          <Link
            href={specimenRevisionHistoryHref(id, query)}
            className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(history.total / history.limit));
  if (query.page > totalPages) {
    redirect(specimenRevisionHistoryHref(id, query, totalPages));
  }

  const specimenName =
    specimen.accessionNumber ??
    specimen.scientificName ??
    specimen.commonName ??
    "Unnamed specimen";

  return (
    <div className="space-y-5">
      <BackLink specimenId={id} />
      <header>
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {specimenName}
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-forest-800">
          Revision history
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Review the protected field-level history recorded across this specimen&rsquo;s
          catalog information. History is read-only and remains available after archival.
        </p>
      </header>
      <SpecimenRevisionHistory specimenId={id} history={history} query={query} />
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
