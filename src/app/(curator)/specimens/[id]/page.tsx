import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { SpecimenFullDetails } from "@/components/specimens/SpecimenFullDetails";
import { getSpecimenDetails } from "@/features/specimens/api";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Specimen Details",
};

type SpecimenDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SpecimenDetailsPage({ params }: SpecimenDetailsPageProps) {
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
        <span className="rounded-full bg-forest-100 px-3 py-1.5 text-xs font-semibold text-forest-800">
          {detail.specimen.status}
        </span>
      </header>

      <SpecimenFullDetails detail={detail} />
    </div>
  );
}
