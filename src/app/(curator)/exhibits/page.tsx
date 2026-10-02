import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/ui/StatCard";
import { ExhibitsWorkspace } from "@/components/exhibits/ExhibitsWorkspace";
import { listExhibits } from "@/features/exhibits-qr/api";
import type { Exhibit, ExhibitRow, ExhibitSpecimenInfo } from "@/features/exhibits-qr/types";
import { getSpecimen } from "@/features/specimens/api";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "QR Exhibits",
};

type ExhibitsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * The exhibit list carries only the specimen id. The museum has a few dozen exhibits at most,
 * so each specimen is looked up individually; a failed lookup leaves that row's names blank.
 */
async function withSpecimens(exhibits: Exhibit[]): Promise<ExhibitRow[]> {
  const ids = [...new Set(exhibits.map((exhibit) => exhibit.specimenId))];
  const results = await Promise.allSettled(ids.map((id) => getSpecimen(id)));
  const specimens = new Map<string, ExhibitSpecimenInfo>();
  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const { commonName, scientificName, accessionNumber } = result.value;
    specimens.set(ids[index], { commonName, scientificName, accessionNumber });
  });
  return exhibits.map((exhibit) => ({ ...exhibit, specimen: specimens.get(exhibit.specimenId) ?? null }));
}

function percentOf(count: number, total: number) {
  return total ? `${((count / total) * 100).toFixed(1)}% of total` : "No exhibits yet";
}

export default async function ExhibitsPage({ searchParams }: ExhibitsPageProps) {
  if (!(await verifySession())) redirect("/login?from=/exhibits");

  const selected = (await searchParams).selected;
  let rows: ExhibitRow[] | null = null;
  try {
    rows = await withSpecimens(await listExhibits());
  } catch {
    rows = null;
  }

  const total = rows?.length ?? 0;
  const published = rows?.filter((row) => row.status === "PUBLISHED").length ?? 0;
  const unpublished = rows?.filter((row) => row.status === "UNPUBLISHED").length ?? 0;
  const disabled = rows?.filter((row) => row.status === "DISABLED").length ?? 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Exhibits</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Create, manage, and publish QR-enabled specimen exhibits.
        </p>
      </div>

      {rows ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Exhibits" value={String(total)} note="Active (not archived)" tone="neutral" icon="cube" />
            <StatCard label="Published" value={String(published)} note={percentOf(published, total)} tone="positive" icon="specimen" />
            <StatCard label="Unpublished" value={String(unpublished)} note={percentOf(unpublished, total)} tone="warning" icon="draft" />
            <StatCard label="Disabled" value={String(disabled)} note={percentOf(disabled, total)} tone="danger" icon="lock" />
          </div>

          <ExhibitsWorkspace
            exhibits={rows}
            initialSelectedId={typeof selected === "string" ? selected : null}
          />
        </>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-semibold">QR exhibits are temporarily unavailable.</p>
          <p className="mt-1 text-amber-900">
            Check your connection and try again. No sample exhibits are shown in place of live data.
          </p>
          <Link
            href="/exhibits"
            className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Retry
          </Link>
        </div>
      )}
    </div>
  );
}
