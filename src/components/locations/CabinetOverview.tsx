import { PanelIcon, LeafIcon } from "@/components/icons";
import { LocationStatCard } from "./LocationStatCard";
import type { LocationNode } from "@/lib/dummy-data/locations";

const LAYOUT_PREVIEW_COUNT = 7;

export function CabinetOverview({ cabinet, onOpen }: { cabinet: LocationNode; onOpen: (id: string) => void }) {
  const drawers = cabinet.children;
  const totalSpecimens = drawers.reduce((sum, d) => sum + (d.specimenCount ?? 0), 0);
  const previewDrawers = drawers.slice(0, LAYOUT_PREVIEW_COUNT);
  const remaining = drawers.length - previewDrawers.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LocationStatCard icon={PanelIcon} label="Total Drawers" value={String(drawers.length)} note="Active" />
        <LocationStatCard
          icon={LeafIcon}
          label="Total Specimens"
          value={totalSpecimens.toLocaleString()}
          note="Across all drawers"
        />
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">Drawers in {cabinet.label}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs text-zinc-500">
                <th className="py-2 pr-3 font-medium">Drawer</th>
                <th className="py-2 pr-3 font-medium">Drawer Code</th>
                <th className="py-2 pr-3 font-medium">Storage Type</th>
                <th className="py-2 pr-3 font-medium">Specimens</th>
                <th className="py-2 pr-3 font-medium">Last Updated</th>
                <th className="py-2 pr-0 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {drawers.map((drawer) => (
                <tr key={drawer.id}>
                  <td className="flex items-center gap-2.5 py-2.5 pr-3 font-medium whitespace-nowrap text-zinc-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                      <PanelIcon className="h-4 w-4" />
                    </span>
                    {drawer.label}
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{drawer.code}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{drawer.storageType}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">
                    {(drawer.specimenCount ?? 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-500">{drawer.updatedAt}</td>
                  <td className="py-2.5 pr-0">
                    <button
                      type="button"
                      onClick={() => onOpen(drawer.id)}
                      className="rounded-lg border border-black/15 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-sage-100"
                    >
                      View Drawer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">{cabinet.label} Layout</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {previewDrawers.map((drawer) => (
            <button
              key={drawer.id}
              type="button"
              onClick={() => onOpen(drawer.id)}
              className="flex flex-col items-start gap-1 rounded-lg border border-black/10 p-3 text-left hover:bg-sage-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                <PanelIcon className="h-4 w-4" />
              </span>
              <p className="mt-1 text-xs font-semibold text-zinc-900">{drawer.label}</p>
              <p className="text-[11px] text-zinc-400">{drawer.code}</p>
              <p className="text-[11px] text-zinc-600">{drawer.storageType}</p>
              <p className="text-[11px] text-zinc-600">{(drawer.specimenCount ?? 0).toLocaleString()} Specimens</p>
            </button>
          ))}
          {remaining > 0 && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-black/15 p-3 text-center">
              <PanelIcon className="h-5 w-5 text-zinc-400" />
              <p className="text-xs font-medium text-zinc-600">+{remaining} more drawers</p>
              <p className="text-[11px] font-medium text-forest-700">View all drawers</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
