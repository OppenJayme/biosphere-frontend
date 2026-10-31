"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { MouseEvent } from "react";
import { selectedSpecimenId, specimenSelectionHref } from "@/features/specimens/selection";
import { SpecimenDetailPanel } from "./SpecimenDetailPanel";
import { SpecimenTable } from "./SpecimenTable";
import { SpecimenToolbar } from "./SpecimenToolbar";
import { TablePagination } from "@/components/ui/TablePagination";
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = selectedSpecimenId(searchParams.get("selected"), items);

  // Native history updates Next's search parameters without refetching this
  // already-loaded page. Modified clicks retain ordinary link navigation.
  function selectSpecimen(event: MouseEvent<HTMLElement>, id: string | null) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    // A double-click selects twice; one history entry keeps Back on the list.
    if (id !== selectedId) window.history.pushState(null, "", specimenSelectionHref(query, id));
    if (window.matchMedia("(max-width: 1279px)").matches) {
      document.getElementById("selected-specimen")?.scrollIntoView({ block: "start" });
    }
  }

  const selected = items.find((specimen) => specimen.id === selectedId) ?? null;

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
        <div className="min-w-0 space-y-4 rounded-xl border border-black/10 bg-white p-5">
          <SpecimenTable
            specimens={items}
            selectedId={selectedId}
            previewHref={(id) => specimenSelectionHref(query, id)}
            onSelect={selectSpecimen}
            onOpen={(id) => router.push(`/specimens/${id}`)}
          />

          <TablePagination
            label="Specimen catalog pages"
            noun="records"
            page={page}
            pageSize={limit}
            total={total}
            hrefFor={(target) => specimenListHref(query, target)}
            sizeHrefFor={(size) => specimenListHref({ ...query, limit: size }, 1)}
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
