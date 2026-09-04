import { ArchiveIcon, CubeIcon, PanelIcon, GridIcon } from "@/components/icons";
import type { LocationNode } from "@/lib/dummy-data/locations";
import type { UnitType } from "@/lib/dummy-data/location-rules";

const UNIT_ICONS: Record<UnitType, typeof ArchiveIcon> = {
  Room: ArchiveIcon,
  Cabinet: CubeIcon,
  Drawer: PanelIcon,
  Container: ArchiveIcon,
  "Display Table": GridIcon,
  "Display Case": PanelIcon,
  "Display Shelf": PanelIcon,
  "Display Cabinet": CubeIcon,
};

export function LocationHeaderCard({
  node,
  parent,
  room,
}: {
  node: LocationNode;
  parent: LocationNode | null;
  room: LocationNode | null;
}) {
  const Icon = UNIT_ICONS[node.unitType];

  const fields: { label: string; value: string; bar?: number }[] = [
    { label: "Type", value: node.unitType },
    { label: "Storage Type", value: node.storageType ?? "—" },
  ];

  if (node.lastAudit) {
    fields.push({ label: "Last Audit", value: node.lastAudit });
  } else if (parent) {
    fields.push({ label: "Parent Location", value: parent.label });
  }

  if (typeof node.occupancyPct === "number") {
    fields.push({ label: "Occupancy", value: `${node.occupancyPct}%`, bar: node.occupancyPct });
  } else if (room && room.id !== node.id) {
    fields.push({ label: "Room", value: room.label });
  }

  return (
    <div className="flex flex-wrap items-center gap-6 rounded-xl border border-black/10 bg-white p-5">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
        <Icon className="h-8 w-8" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-zinc-900">{node.label}</h2>
          <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600">{node.code}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-10 gap-y-2">
          {fields.map((f) => (
            <div key={f.label}>
              <p className="text-xs text-zinc-400">{f.label}</p>
              {f.bar !== undefined ? (
                <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  {f.value}
                  <span className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-100">
                    <span
                      className={`block h-full rounded-full ${f.bar >= 80 ? "bg-amber-500" : "bg-forest-600"}`}
                      style={{ width: `${f.bar}%` }}
                    />
                  </span>
                </p>
              ) : (
                <p className="text-sm font-semibold text-zinc-900">{f.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
