/** Protected storage hierarchy browser backed by the BioSphere API. */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LocationWorkspace } from "@/components/locations/LocationWorkspace";
import { listStorageLocations } from "@/features/storage-locations/api";
import type { StorageUnit } from "@/features/storage-locations/types";
import { ApiError } from "@/lib/api-client";
import { verifySession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Location",
};

export default async function LocationPage() {
  if (!(await verifySession())) redirect("/login?from=/storage");

  let units: StorageUnit[] = [];
  let errorMessage: string | undefined;

  try {
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Location</h1>
        <p className="mt-1 text-sm text-zinc-600">Browse the museum&rsquo;s live storage and display hierarchy.</p>
      </div>

      <LocationWorkspace units={units} errorMessage={errorMessage} />
    </div>
  );
}
