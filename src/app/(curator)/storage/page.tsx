/** Protected storage hierarchy browser backed by the BioSphere API. */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LocationWorkspace } from "@/components/locations/LocationWorkspace";
import { PageHeader } from "@/components/curator/PageHeader";
import {
  getStorageLocationMovements,
  listStorageLocations,
} from "@/features/storage-locations/api";
import type { StorageMovement, StorageUnit } from "@/features/storage-locations/types";
import { storageBrowserView } from "@/features/storage-locations/browser-view";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

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

  if (!errorMessage && selectedId) {
    try {
      movements = await getStorageLocationMovements(selectedId);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        redirect("/login?from=/storage");
      }
      movementError =
        error instanceof ApiError && error.status === 403
          ? "You do not have permission to view location movement history."
          : "Movement history is temporarily unavailable. The location record is still shown.";
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Locations"
        description="Where specimens are kept: rooms, cabinets, drawers, shelves and boxes."
      />

      {notice && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
          {notice}
        </div>
      )}

      <LocationWorkspace
        key={selectedId ?? "default"}
        units={units}
        errorMessage={errorMessage}
        initialSelectedId={selectedId}
        showArchived={view.showArchived}
        movements={movements}
        movementError={movementError}
      />
    </div>
  );
}
