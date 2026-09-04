import { CubeIcon, PanelIcon, GridIcon, ArchiveIcon } from "@/components/icons";
import type { LocationNode } from "@/lib/dummy-data/locations";
import { HIERARCHY_RULES, type UnitType } from "@/lib/dummy-data/location-rules";

const UNIT_ICONS: Record<UnitType, typeof CubeIcon> = {
  Room: ArchiveIcon,
  Cabinet: CubeIcon,
  Drawer: PanelIcon,
  Container: ArchiveIcon,
  "Display Table": GridIcon,
  "Display Case": PanelIcon,
  "Display Shelf": PanelIcon,
  "Display Cabinet": CubeIcon,
};

export function GenericOverview({ node, onOpen }: { node: LocationNode; onOpen: (id: string) => void }) {
  if (node.children.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-8 text-center">
        <p className="text-sm text-zinc-600">{HIERARCHY_RULES[node.unitType].canHoldHelp}</p>
        <p className="mt-1 text-xs text-zinc-400">
          Specimens assigned here will appear once cataloging is wired up.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-900">Units in {node.label}</h3>
      <ul className="divide-y divide-black/5">
        {node.children.map((child) => {
          const Icon = UNIT_ICONS[child.unitType];
          return (
            <li key={child.id}>
              <button
                type="button"
                onClick={() => onOpen(child.id)}
                className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-sage-50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-zinc-900">{child.label}</span>
                  <span className="block text-xs text-zinc-500">{child.code}</span>
                </span>
                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                  {child.unitType}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
