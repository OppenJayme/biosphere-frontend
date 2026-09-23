import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SpecimensWorkspace } from "@/components/specimens/SpecimensWorkspace";
import { listCollections, searchSpecimens } from "@/features/specimens/api";
import {
  parseSpecimenListQuery,
  type MuseumCollection,
  type SpecimenPage,
} from "@/features/specimens/types";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Specimens",
};

type SpecimensPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SpecimensPage({ searchParams }: SpecimensPageProps) {
  const user = await verifySession();
  if (!user) redirect("/login?from=/specimens");

  const query = parseSpecimenListQuery(await searchParams);
  const [specimenResult, collectionResult] = await Promise.allSettled([
    searchSpecimens(query),
    listCollections(),
  ]);
  // Specimen data is essential; collection options degrade independently to preserve catalog access.
  const specimenPage: SpecimenPage | null =
    specimenResult.status === "fulfilled" ? specimenResult.value : null;
  const collections: MuseumCollection[] =
    collectionResult.status === "fulfilled" ? collectionResult.value : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Specimens</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Browse, filter, and sort protected museum specimen records.
        </p>
      </div>

      {specimenPage ? (
        <SpecimensWorkspace
          specimenPage={specimenPage}
          query={query}
          collections={collections}
          collectionLookupAvailable={collectionResult.status === "fulfilled"}
          offlineOwnerId={user.id}
        />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">The specimen catalog is temporarily unavailable.</p>
          <p className="mt-1 text-amber-900">
            Check your connection and try again. No sample records are shown in place of live data.
          </p>
          <Link
            href="/specimens"
            className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Retry catalog
          </Link>
        </div>
      )}
    </div>
  );
}
