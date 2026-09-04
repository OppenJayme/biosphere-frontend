import { CubeIcon, PanelIcon, LeafIcon, ArrowRightIcon, AlertTriangleIcon } from "@/components/icons";
import { LocationStatCard } from "./LocationStatCard";
import { totalSpecimens as specimenTotal, type LocationNode } from "@/lib/dummy-data/locations";

export function RoomOverview({ room, onOpen }: { room: LocationNode; onOpen: (id: string) => void }) {
  const cabinets = room.children;
  const totalDrawers = cabinets.reduce((sum, c) => sum + c.children.length, 0);
  const totalSpecimenCount = cabinets.reduce((sum, c) => sum + specimenTotal(c), 0);
  const fullCabinets = cabinets.filter((c) => (c.occupancyPct ?? 0) >= 80);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <LocationStatCard icon={CubeIcon} label="Total Cabinets" value={String(cabinets.length)} note="Active" />
        <LocationStatCard icon={PanelIcon} label="Total Drawers" value={String(totalDrawers)} note="Active" />
        <LocationStatCard
          icon={LeafIcon}
          label="Total Specimens"
          value={totalSpecimenCount.toLocaleString()}
          note="Across all drawers"
        />
        <LocationStatCard
          icon={CubeIcon}
          label="Occupancy"
          value={`${room.occupancyPct ?? 0}%`}
          note="of total capacity"
        />
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-900">Cabinets in {room.label}</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-xs text-zinc-500">
                <th className="py-2 pr-3 font-medium">Cabinet</th>
                <th className="py-2 pr-3 font-medium">Cabinet Code</th>
                <th className="py-2 pr-3 font-medium">Collection Section</th>
                <th className="py-2 pr-3 font-medium"># Drawers</th>
                <th className="py-2 pr-3 font-medium">Specimens</th>
                <th className="py-2 pr-3 font-medium">Occupancy</th>
                <th className="py-2 pr-0 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {cabinets.map((cabinet) => (
                <tr key={cabinet.id} onClick={() => onOpen(cabinet.id)} className="cursor-pointer hover:bg-sage-50">
                  <td className="flex items-center gap-2.5 py-2.5 pr-3 font-medium whitespace-nowrap text-zinc-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                      <CubeIcon className="h-4 w-4" />
                    </span>
                    {cabinet.label}
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{cabinet.code}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{cabinet.storageType}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{cabinet.children.length}</td>
                  <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">
                    {specimenTotal(cabinet).toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${(cabinet.occupancyPct ?? 0) >= 80 ? "text-amber-600" : "text-zinc-700"}`}
                      >
                        {cabinet.occupancyPct}%
                      </span>
                      <span className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100">
                        <span
                          className={`block h-full rounded-full ${(cabinet.occupancyPct ?? 0) >= 80 ? "bg-amber-500" : "bg-forest-600"}`}
                          style={{ width: `${cabinet.occupancyPct ?? 0}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-0 whitespace-nowrap text-zinc-500">{cabinet.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-black/10 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900">Cabinet Layout in {room.label}</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {cabinets.map((cabinet) => {
              const full = (cabinet.occupancyPct ?? 0) >= 80;
              return (
                <div
                  key={cabinet.id}
                  className={`flex flex-col gap-3 rounded-xl border p-4 ${full ? "border-amber-300" : "border-black/10"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                      <CubeIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-zinc-900">{cabinet.label}</p>
                        {full && <AlertTriangleIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                      </div>
                      <p className="text-xs text-zinc-500">{cabinet.code}</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        {cabinet.children.length} Drawers &middot; {specimenTotal(cabinet).toLocaleString()}{" "}
                        Specimens
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <span
                        className={`block h-full rounded-full ${full ? "bg-amber-500" : "bg-forest-600"}`}
                        style={{ width: `${cabinet.occupancyPct ?? 0}%` }}
                      />
                    </span>
                    <span className="text-xs font-medium text-zinc-500">{cabinet.occupancyPct}%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpen(cabinet.id)}
                    className="rounded-lg border border-black/15 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-sage-100"
                  >
                    Open Cabinet
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900">Alerts &amp; Notifications</h3>
          {fullCabinets.length === 0 ? (
            <p className="text-xs text-zinc-500">No alerts right now &mdash; all cabinets are within capacity.</p>
          ) : (
            <ul className="space-y-3">
              {fullCabinets.map((cabinet) => (
                <li key={cabinet.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(cabinet.id)}
                    className="flex w-full items-start gap-2.5 text-left"
                  >
                    <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-zinc-900">
                        {cabinet.label} is {cabinet.occupancyPct}% full
                      </span>
                      <span className="block text-xs text-zinc-500">
                        Consider redistributing specimens or adding capacity.
                      </span>
                    </span>
                    <ArrowRightIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
