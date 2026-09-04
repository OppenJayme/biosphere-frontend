import { LeafIcon, GridIcon, ArchiveIcon, BugIcon } from "@/components/icons";
import { LocationStatCard } from "./LocationStatCard";
import type { LocationNode } from "@/lib/dummy-data/locations";

const CONDITION_STYLES: Record<string, string> = {
  Good: "bg-forest-100 text-forest-700",
  Fair: "bg-amber-100 text-amber-700",
  Poor: "bg-red-100 text-red-700",
};

const STATUS_STYLES: Record<string, string> = {
  Cataloged: "bg-forest-100 text-forest-700",
  Draft: "bg-zinc-100 text-zinc-600",
  "Needs Review": "bg-sky-100 text-sky-700",
};

export function DrawerOverview({ drawer }: { drawer: LocationNode }) {
  const specimens = drawer.specimens ?? [];
  const groups = drawer.specimenGroups ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <LocationStatCard
          icon={LeafIcon}
          label="Total Specimens"
          value={(drawer.specimenCount ?? 0).toLocaleString()}
        />
        <LocationStatCard icon={GridIcon} label="Total Categories" value={String(groups.length)} />
        <LocationStatCard icon={ArchiveIcon} label="Distinct Records" value={String(specimens.length)} />
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">Specimens in {drawer.label}</h3>
        {specimens.length === 0 ? (
          <p className="py-6 text-center text-xs text-zinc-500">No specimen records for this drawer yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/10 text-xs text-zinc-500">
                  <th className="py-2 pr-3 font-medium">Specimen</th>
                  <th className="py-2 pr-3 font-medium">Accession No</th>
                  <th className="py-2 pr-3 font-medium">Scientific Name</th>
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 font-medium">Quantity</th>
                  <th className="py-2 pr-3 font-medium">Condition</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-0 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {specimens.map((s, i) => (
                  <tr key={`${s.accessionNo}-${i}`}>
                    <td className="py-2.5 pr-3 font-medium whitespace-nowrap text-zinc-900">{s.specimen}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{s.accessionNo}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap italic text-zinc-600">{s.scientificName}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{s.category}</td>
                    <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{s.quantity}</td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${CONDITION_STYLES[s.condition]}`}>
                        {s.condition}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[s.status]}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-0 whitespace-nowrap text-zinc-500">{s.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {groups.length > 0 && (
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900">Specimen Groups in {drawer.label}</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {groups.map((group) => (
              <div key={group.label} className="rounded-lg border border-black/10 p-4 text-center">
                <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 text-forest-700">
                  <BugIcon className="h-4.5 w-4.5" />
                </span>
                <p className="mt-2 text-lg font-semibold text-zinc-900">{group.count}</p>
                <p className="text-xs text-zinc-500">{group.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
