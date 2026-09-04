import type { Metadata } from "next";
import { LocationWorkspace } from "@/components/locations/LocationWorkspace";

export const metadata: Metadata = {
  title: "Location",
};

export default function LocationPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Location</h1>
        <p className="mt-1 text-sm text-zinc-600">Browse and manage the museum&rsquo;s storage and display hierarchy.</p>
      </div>

      <LocationWorkspace />
    </div>
  );
}
