import Link from "next/link";
import {
  ArchiveIcon,
  CubeIcon,
  PanelIcon,
  GridIcon,
  PencilIcon,
  PlusIcon,
  PrinterIcon,
  ClockIcon,
  MoveIcon,
} from "@/components/icons";
import { HIERARCHY_RULES, type UnitType } from "@/lib/dummy-data/location-rules";
import {
  LOCATION_RECENT_ACTIVITY,
  totalSpecimens as specimenTotal,
  type LocationNode,
} from "@/lib/dummy-data/locations";

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

function totalDrawersUnder(node: LocationNode): number {
  if (node.unitType === "Drawer") return 1;
  return node.children.reduce((sum, c) => sum + totalDrawersUnder(c), 0);
}

export function LocationSelectedPanel({
  node,
  parent,
  room,
  onAddChild,
}: {
  node: LocationNode;
  parent: LocationNode | null;
  room: LocationNode | null;
  onAddChild: () => void;
}) {
  const Icon = UNIT_ICONS[node.unitType];
  const canAddChild = HIERARCHY_RULES[node.unitType].allowedChildren.length > 0;
  const isLeaf = !canAddChild;

  const fields: { label: string; value: string }[] = [
    { label: "Location Code", value: node.code },
    { label: "Unit Type", value: node.unitType },
  ];
  if (parent) fields.push({ label: "Parent Location", value: parent.label });
  if (room && room.id !== node.id) fields.push({ label: "Room", value: room.label });
  if (node.unitType === "Room") fields.push({ label: "Child Cabinets", value: String(node.children.length) });
  if (node.unitType === "Drawer" && node.drawerSize) fields.push({ label: "Drawer Size", value: node.drawerSize });
  if (!isLeaf) fields.push({ label: "Total Drawers", value: String(totalDrawersUnder(node)) });
  fields.push({ label: "Total Specimens", value: specimenTotal(node).toLocaleString() });
  if (node.updatedAt) fields.push({ label: "Last Updated", value: node.updatedAt });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">Selected Location</h3>
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
            <Icon className="h-7 w-7" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-zinc-900">{node.label}</p>
              <span className="shrink-0 rounded-md bg-forest-100 px-2 py-0.5 text-[10px] font-semibold text-forest-700">
                {node.code}
              </span>
            </div>
            <p className="text-xs text-zinc-500">{node.unitType}</p>
          </div>
        </div>

        <dl className="mt-4 space-y-2.5 border-t border-black/10 pt-4">
          {fields.map((f) => (
            <div key={f.label} className="flex items-center justify-between gap-3 text-xs">
              <dt className="text-zinc-500">{f.label}</dt>
              <dd className="text-right font-medium text-zinc-900">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 border-t border-black/10 pt-4">
          <p className="mb-2 text-xs font-semibold text-zinc-900">Quick Actions</p>
          <ul className="space-y-1">
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-sage-50"
              >
                <PencilIcon className="h-4 w-4 text-zinc-400" />
                Edit {node.unitType}
              </button>
            </li>
            {canAddChild && (
              <li>
                <button
                  type="button"
                  onClick={onAddChild}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-sage-50"
                >
                  <PlusIcon className="h-4 w-4 text-zinc-400" />
                  Add {HIERARCHY_RULES[node.unitType].allowedChildren[0]}
                </button>
              </li>
            )}
            {node.unitType === "Drawer" && (
              <>
                <li>
                  <Link
                    href="/specimens/new"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-sage-50"
                  >
                    <PlusIcon className="h-4 w-4 text-zinc-400" />
                    Add Specimen
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-sage-50"
                  >
                    <MoveIcon className="h-4 w-4 text-zinc-400" />
                    Move Specimen
                  </button>
                </li>
              </>
            )}
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-sage-50"
              >
                <PrinterIcon className="h-4 w-4 text-zinc-400" />
                Print Location Label
              </button>
            </li>
            <li>
              <Link
                href="/audit-logs"
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-zinc-700 hover:bg-sage-50"
              >
                <ClockIcon className="h-4 w-4 text-zinc-400" />
                View Full History
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">Recent Activity</h3>
        <ul className="space-y-3">
          {LOCATION_RECENT_ACTIVITY.map((entry) => (
            <li key={entry.description + entry.timestamp}>
              <p className="text-sm font-medium text-zinc-900">{entry.description}</p>
              <p className="text-xs text-zinc-500">
                {entry.by} &middot; {entry.timestamp}
              </p>
            </li>
          ))}
        </ul>
        <button type="button" className="mt-3 text-xs font-medium text-forest-700 hover:text-forest-800">
          View all activity
        </button>
      </div>
    </div>
  );
}
