/** Protected storage hierarchy browser backed by the BioSphere API. */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LocationWorkspace } from "@/components/locations/LocationWorkspace";
import { PageHeader } from "@/components/curator/PageHeader";
import {
  getStorageInventory,
  getStorageLocationMovements,
  getStorageLotMovements,
  getStorageOccupancySummary,
  listStorageLocations,
} from "@/features/storage-locations/api";
import type { SpecimenLotHistoryEntry } from "@/features/specimen-lots/types";
import type {
  StorageInventoryPage,
  StorageMovement,
  StorageOccupancy,
  StorageUnit,
} from "@/features/storage-locations/types";
import { storageBrowserView } from "@/features/storage-locations/browser-view";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";
import { FlashToast } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Locations",
};

type LocationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const notices: Record<string, string> = {
  created: "The storage location was created.",
  updated: "The storage location details were updated.",
  moved: "The storage location was moved and its movement history was recorded.",
  archived: "The storage location was archived.",
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LocationPage({ searchParams }: LocationPageProps) {
  if (!(await verifySession())) redirect("/login?from=/storage");

  const params = await searchParams;
  const selectedResult = z.uuid().safeParse(firstValue(params.selected));
  const notice = notices[firstValue(params.notice) ?? ""];

  let units: StorageUnit[] = [];
  let errorMessage: string | undefined;
  let movements: StorageMovement[] = [];
  let movementError: string | undefined;

  try {
    // Keep the existing complete, protected read for history paths and parent validation.
    // Visibility is a presentation filter, never a change to stored hierarchy or inventory.
    units = await listStorageLocations("ALL");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login?from=/storage");
    }
    errorMessage =
      error instanceof ApiError && error.status === 403
        ? "Your active account does not have permission to view storage locations."
        : "Storage locations are temporarily unavailable. Check the backend connection and try again.";
  }

  const requestedId = selectedResult.success ? selectedResult.data : undefined;
  const view = storageBrowserView(units, { selectedId: requestedId, archived: firstValue(params.archived) });
  const selectedId = view.selected?.id;

  // Occupancy, inventory and lot activity are extras on top of the hierarchy: each loads on its
  // own, and a failure shows a note in its panel instead of hiding the location.
  let occupancy: StorageOccupancy[] | null = null;
  let inventory: StorageInventoryPage | null = null;
  let inventoryError: string | undefined;
  let lotChanges: SpecimenLotHistoryEntry[] = [];
  let lotChangeTotal = 0;
  if (!errorMessage) {
    const holdsSpecimens = Boolean(view.selected?.holdsSpecimens);
    const [movementResult, occupancyResult, inventoryResult, lotResult] = await Promise.allSettled([
      selectedId ? getStorageLocationMovements(selectedId) : Promise.resolve([]),
      getStorageOccupancySummary(),
      selectedId && holdsSpecimens ? getStorageInventory(selectedId) : Promise.resolve(null),
      selectedId ? getStorageLotMovements(selectedId) : Promise.resolve(null),
    ]);
    for (const result of [movementResult, occupancyResult, inventoryResult, lotResult]) {
      if (result.status === "rejected" && result.reason instanceof ApiError && result.reason.status === 401) {
        redirect("/login?from=/storage");
      }
    }

    if (movementResult.status === "fulfilled") movements = movementResult.value;
    else {
      movementError =
        movementResult.reason instanceof ApiError && movementResult.reason.status === 403
          ? "You do not have permission to view location movement history."
          : "Movement history is temporarily unavailable. The location record is still shown.";
    }
    if (occupancyResult.status === "fulfilled") occupancy = occupancyResult.value;
    if (inventoryResult.status === "fulfilled") inventory = inventoryResult.value;
    else inventoryError = "The specimens in this location could not be loaded. Try again in a moment.";
    if (lotResult.status === "fulfilled") {
      lotChanges = lotResult.value?.items ?? [];
      lotChangeTotal = lotResult.value?.total ?? 0;
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Locations"
        description="Where specimens are kept: rooms, cabinets, drawers, shelves and boxes."
      />

      {/* The outcome of the last action, shown once as a toast and then removed from the URL. */}
      <FlashToast message={notice ?? null} params="notice" />

      <LocationWorkspace
        key={selectedId ?? "default"}
        units={units}
        errorMessage={errorMessage}
        initialSelectedId={selectedId}
        showArchived={view.showArchived}
        movements={movements}
        movementError={movementError}
        occupancy={occupancy}
        inventory={inventory}
        inventoryError={inventoryError}
        lotChanges={lotChanges}
        lotChangeTotal={lotChangeTotal}
      />
    </div>
  );
}
