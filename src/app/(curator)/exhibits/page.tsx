import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExhibitsWorkspace } from "@/components/exhibits/ExhibitsWorkspace";
import { listExhibits } from "@/features/exhibits-qr/api";
import type { Exhibit, ExhibitRow, ExhibitSpecimenInfo } from "@/features/exhibits-qr/types";
import { getSpecimen } from "@/features/specimens/api";
import { verifySession } from "@/lib/session";
import { PageHeader } from "@/components/curator/PageHeader";

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

export default async function ExhibitsPage({ searchParams }: ExhibitsPageProps) {
  if (!(await verifySession())) redirect("/login?from=/exhibits");

  const params = await searchParams;
  const selected = params.selected;
  let rows: ExhibitRow[] | null = null;
  try {
    rows = await withSpecimens(await listExhibits());
  } catch {
    rows = null;
  }


  return (
    <div className="space-y-5">
      <PageHeader
        title="QR Exhibits"
        description="Web pages for selected specimens, opened by scanning a QR label in the museum."
        info="Only published exhibits of cataloged, publicly eligible specimens are visible to visitors. Each exhibit page has a QR code and a short web address you can print."
      />

      {rows ? (
        <>
          <ExhibitsWorkspace
            exhibits={rows}
            initialSelectedId={typeof selected === "string" ? selected : null}
            openCreate={params.create === "1"}
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
