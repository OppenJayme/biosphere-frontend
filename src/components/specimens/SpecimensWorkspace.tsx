"use client";

import { useSearchParams } from "next/navigation";
import type { MouseEvent } from "react";
import { selectedSpecimenId, specimenSelectionHref } from "@/features/specimens/selection";
import { SpecimenDetailPanel } from "./SpecimenDetailPanel";
import { SpecimenTable } from "./SpecimenTable";
import { SpecimenToolbar } from "./SpecimenToolbar";
import { PrevNextPagination } from "@/components/ui/PrevNextPagination";
import {
  specimenListHref,
  type MuseumCollection,
  type SpecimenListQuery,
  type SpecimenPage,
  type SpecimenStatus,
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
  statusCounts,
}: {
  specimenPage: SpecimenPage;
  query: SpecimenListQuery;
  collections: MuseumCollection[];
  collectionLookupAvailable: boolean;
  storageOptions: StoragePathOption[];
  storageLookupAvailable: boolean;
  filterError: string | null;
  offlineOwnerId: string;
  statusCounts?: Record<SpecimenStatus, number>;
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
        statusCounts={statusCounts}
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 rounded-xl border border-black/10 bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-zinc-600">
              {total === 0
                ? "No records found"
                : `Showing ${firstRecord}–${lastRecord} of ${total} specimen records`}
            </p>
            <PrevNextPagination
              label="Specimen catalog pages"
              page={page}
              totalPages={totalPages}
              hrefFor={(target) => specimenListHref(query, target)}
            />
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

      <OfflineSpecimenPanel ownerId={offlineOwnerId} />
    </div>
  );
}
