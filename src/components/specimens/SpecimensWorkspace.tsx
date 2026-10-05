"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { MouseEvent } from "react";
import { selectedSpecimenId, specimenSelectionHref } from "@/features/specimens/selection";
import { SpecimenDetailPanel } from "./SpecimenDetailPanel";
import { SpecimenTable } from "./SpecimenTable";
import { SpecimenToolbar } from "./SpecimenToolbar";
import {
  specimenListHref,
  type MuseumCollection,
  type SpecimenListQuery,
  type SpecimenPage,
} from "@/features/specimens/types";
import type { StoragePathOption } from "@/features/storage-locations/hierarchy";
import { OfflineSpecimenPanel } from "@/features/offline/components/OfflineSpecimenPanel";

export function SpecimensWorkspace({
  specimenPage,
  query,
  collections,
  collectionLookupAvailable,
  storageOptions,
  storageLookupAvailable,
  filterError,
  offlineOwnerId,
}: {
  specimenPage: SpecimenPage;
  query: SpecimenListQuery;
  collections: MuseumCollection[];
  collectionLookupAvailable: boolean;
  storageOptions: StoragePathOption[];
  storageLookupAvailable: boolean;
  filterError: string | null;
  offlineOwnerId: string;
}) {
  const { items, limit, page, total } = specimenPage;
  const searchParams = useSearchParams();
  const selectedId = selectedSpecimenId(searchParams.get("selected"), items);

  // Native history updates Next's search parameters without refetching this
  // already-loaded page. Modified clicks retain ordinary link navigation.
  function selectSpecimen(event: MouseEvent<HTMLElement>, id: string | null) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    window.history.pushState(null, "", specimenSelectionHref(query, id));
    if (window.matchMedia("(max-width: 1279px)").matches) {
      document.getElementById("selected-specimen")?.scrollIntoView({ block: "start" });
    }
  }

  const selected = items.find((specimen) => specimen.id === selectedId) ?? null;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const firstRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRecord = Math.min(page * limit, total);

  return (
    <div className="space-y-4">
      <SpecimenToolbar
        query={query}
        collections={collections}
        collectionLookupAvailable={collectionLookupAvailable}
        storageOptions={storageOptions}
        storageLookupAvailable={storageLookupAvailable}
        filterError={filterError}
      />

      <OfflineSpecimenPanel ownerId={offlineOwnerId} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 rounded-xl border border-black/10 bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-zinc-600">
              {total === 0
                ? "No records found"
                : `Showing ${firstRecord}–${lastRecord} of ${total} specimen records`}
            </p>
            {totalPages > 1 && (
              <nav
                aria-label="Specimen catalog pages"
                className="flex items-center gap-1.5 text-sm"
              >
                {page > 1 ? (
                  <Link
                    href={specimenListHref(query, page - 1)}
                    className="rounded-md border border-black/15 px-3 py-1.5 font-medium text-zinc-700 hover:bg-sage-100"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="rounded-md border border-black/10 px-3 py-1.5 text-zinc-400">
                    Previous
                  </span>
                )}
                <span className="px-1 text-xs text-zinc-500">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages ? (
                  <Link
                    href={specimenListHref(query, page + 1)}
                    className="rounded-md border border-black/15 px-3 py-1.5 font-medium text-zinc-700 hover:bg-sage-100"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="rounded-md border border-black/10 px-3 py-1.5 text-zinc-400">
                    Next
                  </span>
                )}
              </nav>
            )}
          </div>

          <SpecimenTable
            specimens={items}
            selectedId={selectedId}
            previewHref={(id) => specimenSelectionHref(query, id)}
            onSelect={selectSpecimen}
          />
        </div>

        <SpecimenDetailPanel
          specimen={selected}
          clearHref={specimenSelectionHref(query, null)}
          onClear={(event) => selectSpecimen(event, null)}
        />
      </div>
    </div>
  );
}
