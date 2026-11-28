/**
 * Locations tab: the storage hierarchy on the left (sticky, so another location is one click away
 * from anywhere on the page) and the selected location on the right. The location header carries
 * its details and quick actions; rooms and cabinets list what is inside them with totals rolled up
 * from below, and units that hold specimens list their lots. Everything shown comes from the
 * backend, and no record id is ever shown on screen. Archived locations stay read-only.
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type ComponentType, type ReactNode, type SVGProps } from "react";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  LayersIcon,
  LeafIcon,
  MapPinIcon,
  MoveIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";
import { InfoTip } from "@/components/ui/InfoTip";
import { ModalButton } from "@/components/ui/ModalButton";
import { TablePagination } from "@/components/ui/TablePagination";
import type { SpecimenLotHistoryEntry } from "@/features/specimen-lots/types";
import { storageBrowserHref, storageBrowserView } from "@/features/storage-locations/browser-view";
import { buildStorageHierarchy, filterStorageUnits, storagePath } from "@/features/storage-locations/hierarchy";
import {
  recentActivity,
  specimenGroups,
  storageTotals,
  type ActivityEntry,
  type StorageTotals,
} from "@/features/storage-locations/overview";
import type {
  StorageInventoryPage,
  StorageMovement,
  StorageOccupancy,
  StorageUnit,
} from "@/features/storage-locations/types";
import { LocationTree } from "./LocationTree";
import {
  ArchiveStorageLocationForm,
  CreateStorageLocationForm,
  MoveStorageLocationForm,
  StorageLocationManagement,
  UpdateStorageLocationForm,
} from "./StorageLocationManagement";
import { StorageLifecycleBadge } from "./StorageLifecycleBadge";

type LocationWorkspaceProps = {
  units: StorageUnit[];
  errorMessage?: string;
  initialSelectedId?: string;
  showArchived: boolean;
  movements: StorageMovement[];
  movementError?: string;
  /** Null when the occupancy summary could not be loaded; totals then read "Not available". */
  occupancy: StorageOccupancy[] | null;
  /** Lots placed directly in the selected unit; null when it does not hold specimens. */
  inventory: StorageInventoryPage | null;
  inventoryError?: string;
  lotChanges: SpecimenLotHistoryEntry[];
  /** All lot changes involving the unit; only the newest 100 are loaded. */
  lotChangeTotal: number;
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

const cardClasses = "rounded-xl border border-black/10 bg-white";
const actionClasses =
  "inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:border-forest-700/40 hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700";
const tableHeadClasses = "border-y border-black/5 bg-sage-50/60 text-zinc-500";

export function LocationWorkspace({
  units,
  errorMessage,
  initialSelectedId,
  showArchived,
  movements,
  movementError,
  occupancy,
  inventory,
  inventoryError,
  lotChanges,
  lotChangeTotal,
}: LocationWorkspaceProps) {
  const router = useRouter();
  const [selectionPending, startSelectionTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(initialSelectedId ?? "");
  const view = useMemo(
    () => storageBrowserView(units, { selectedId, archived: showArchived ? "1" : "0" }),
    [units, selectedId, showArchived],
  );
  // Archived records are listed in their own group, so the tree only holds active locations.
  const activeUnits = useMemo(() => view.visibleUnits.filter((unit) => !unit.archivedAt), [view.visibleUnits]);
  const archivedUnits = useMemo(
    () =>
      view.visibleUnits
        .filter((unit) => Boolean(unit.archivedAt))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" })),
    [view.visibleUnits],
  );
  const hierarchy = useMemo(() => buildStorageHierarchy(activeUnits), [activeUnits]);
  const totals = useMemo(() => (occupancy ? storageTotals(units, occupancy) : null), [units, occupancy]);
  const [query, setQuery] = useState("");

  const selected = view.selected;
  const matches = useMemo(() => filterStorageUnits(view.visibleUnits, query), [query, view.visibleUnits]);
  const path = selected ? storagePath(units, selected.id) : [];
  // The workspace remounts per selection, so its data is fresh once the server has caught up.
  const dataPending = selectionPending || (selected ? selected.id !== initialSelectedId : false);

  const selectUnit = (id: string) => {
    if (id === selectedId || selectionPending) return;
    const target = units.find((unit) => unit.id === id);
    if (!target) return;
    setSelectedId(id);
    startSelectionTransition(() => {
      router.replace(storageBrowserHref(id, showArchived || Boolean(target.archivedAt)), { scroll: false });
    });
  };

  // Hiding history chooses an active fallback rather than leaving a hidden selection in details.
  const toggleArchived = (next: boolean) => {
    if (selectionPending) return;
    const nextView = storageBrowserView(units, { selectedId, archived: next ? "1" : "0" });
    startSelectionTransition(() => {
      router.replace(storageBrowserHref(nextView.selected?.id, next), { scroll: false });
    });
  };

  if (errorMessage) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <p className="font-semibold">Unable to load storage locations</p>
        <p className="mt-1">{errorMessage}</p>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="space-y-5">
        <ArchiveVisibilityToggle showArchived={showArchived} pending={selectionPending} onChange={toggleArchived} />
        <div className={`${cardClasses} p-8 text-center`}>
          <ArchiveIcon className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-sm font-semibold text-zinc-900">
            {units.length ? "No active storage locations" : "No storage locations yet"}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {units.length ? "Enable Show archived locations to review historical records." : "Create the first top-level storage location below."}
          </p>
        </div>
        <StorageLocationManagement units={units} />
      </div>
    );
  }

  const selectedTotals = totals?.get(selected.id);
  const ancestorIds = new Set(path.slice(0, -1).map((unit) => unit.id));
  const activity = recentActivity(selected.id, units, movements, lotChanges);

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
      {/* Stays in view below the sticky top bar, its tree scrolling on its own, so switching
          locations never needs a scroll back up. */}
      <aside className={`${cardClasses} flex flex-col p-4 lg:sticky lg:top-[5.25rem] lg:max-h-[calc(100dvh-6.5rem)]`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-zinc-900">Storage Hierarchy</h2>
          <InfoTip label="Storage Hierarchy" align="end">
            Specimens are listed for units that hold them (drawers, jars, trays, boxes). Rooms and cabinets show
            totals from the units inside them.
          </InfoTip>
        </div>
        <ArchiveVisibilityToggle showArchived={showArchived} pending={selectionPending} onChange={toggleArchived} />
        <label className="relative mb-3 block">
          <span className="sr-only">Search storage locations</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search locations…"
            className="w-full rounded-lg border border-black/15 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
        </label>

        <div className="min-h-0 flex-1 overflow-y-auto max-lg:max-h-[28rem]">
          {query.trim() ? (
            <ul className="space-y-0.5">
              {[...matches]
                .sort((a, b) => Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt)))
                .map((unit) => (
                  <li key={unit.id}>
                    <button
                      type="button"
                      onClick={() => selectUnit(unit.id)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
                        unit.id === selected.id ? "bg-forest-50 font-semibold text-forest-800" : "text-zinc-700 hover:bg-sage-50"
                      }`}
                    >
                      <span className="truncate">{unit.label}</span>
                      <StorageLifecycleBadge archived={Boolean(unit.archivedAt)} />
                      <TypeChip>{unit.unitType}</TypeChip>
                    </button>
                  </li>
                ))}
              {matches.length === 0 && (
                <li className="py-6 text-center text-xs text-zinc-500">No storage locations match that search.</li>
              )}
            </ul>
          ) : (
            <>
              {showArchived && <GroupHeading>Active</GroupHeading>}
              <LocationTree nodes={hierarchy} selectedId={selected.id} expandedIds={ancestorIds} onSelect={selectUnit} />
              {showArchived && (
                <>
                  <GroupHeading className="mt-4 border-t border-black/10 pt-3">Archived</GroupHeading>
                  {archivedUnits.length > 0 ? (
                    <ul className="space-y-0.5">
                      {archivedUnits.map((unit) => (
                        <li key={unit.id}>
                          <button
                            type="button"
                            onClick={() => selectUnit(unit.id)}
                            className={`flex w-full flex-col rounded-lg px-2.5 py-2 text-left text-sm ${
                              unit.id === selected.id ? "bg-forest-50 font-semibold text-forest-800" : "text-zinc-600 hover:bg-sage-50"
                            }`}
                          >
                            <span className="truncate">{unit.label}</span>
                            <span className="truncate text-[0.6875rem] font-normal text-zinc-500">
                              {storagePath(units, unit.id).slice(0, -1).map((parent) => parent.label).join(" › ") || "Top level"}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-2.5 py-2 text-xs text-zinc-500">No archived locations.</p>
                  )}
                </>
              )}
            </>
          )}
        </div>

        <div className="mt-3 border-t border-black/10 pt-3">
          <ModalButton
            key={`add-${selected.id}`}
            title="Add storage location"
            description={selected.archivedAt ? undefined : `Its parent starts as ${selected.label}; you can change it.`}
            size="lg"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-forest-700 px-3 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
            label={
              <>
                <PlusIcon className="h-4 w-4" />
                Add Location
              </>
            }
          >
            <CreateStorageLocationForm units={units} parentId={selected.archivedAt ? "" : selected.id} />
          </ModalButton>
        </div>
      </aside>

      <main className="min-w-0 space-y-4" aria-busy={dataPending || undefined}>
        <nav aria-label="Storage location path" className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          <MapPinIcon className="h-3.5 w-3.5 text-forest-700" aria-hidden="true" />
          {path.map((unit, index) => (
            <span key={unit.id} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-zinc-300">/</span>}
              <button
                type="button"
                onClick={() => selectUnit(unit.id)}
                aria-current={index === path.length - 1 ? "location" : undefined}
                className={`inline-flex items-center gap-1 ${index === path.length - 1 ? "font-semibold text-forest-700" : "hover:text-forest-700"}`}
              >
                {unit.label}
                <StorageLifecycleBadge archived={Boolean(unit.archivedAt)} />
              </button>
            </span>
          ))}
        </nav>

        <LocationHeader unit={selected} parent={path.length > 1 ? path[path.length - 2] : null} units={units} />

        {selected.holdsSpecimens ? (
          <HoldingUnitOverview unit={selected} inventory={inventory} inventoryError={inventoryError} pending={dataPending} />
        ) : (
          <ContainerStats unit={selected} inside={view.activeChildren} totals={selectedTotals} occupancyLoaded={Boolean(occupancy)} />
        )}

        {view.activeChildren.length > 0 ? (
          <ChildrenSection parent={selected} inside={view.activeChildren} units={units} totals={totals} onSelect={selectUnit} />
        ) : (
          !selected.holdsSpecimens && (
            <section className={`${cardClasses} p-5`}>
              <p className="text-sm text-zinc-500">
                Nothing is inside {selected.label} yet. Use <span className="font-medium text-zinc-700">Add location inside</span> to
                add a cabinet, drawer, shelf or box.
              </p>
            </section>
          )
        )}

        {showArchived && view.archivedChildren.length > 0 && (
          <section className={`${cardClasses} p-5`}>
            <h3 className="text-sm font-semibold text-zinc-900">Archived locations inside {selected.label}</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {view.archivedChildren.map((child) => (
                <li key={child.id}>
                  <button
                    type="button"
                    onClick={() => selectUnit(child.id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-zinc-50 p-3 text-left hover:border-forest-300"
                  >
                    <ArchiveIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800">{child.label}</span>
                    <StorageLifecycleBadge archived />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ActivitySection
          unit={selected}
          entries={activity}
          olderLotChanges={Math.max(0, lotChangeTotal - lotChanges.length)}
          movementError={movementError}
          pending={dataPending}
        />
      </main>
    </div>
  );
}

/** The location's identity, details and quick actions in one card. */
function LocationHeader({ unit, parent, units }: { unit: StorageUnit; parent: StorageUnit | null; units: StorageUnit[] }) {
  const archived = Boolean(unit.archivedAt);
  return (
    <section className={cardClasses} aria-labelledby="location-heading">
      <div className="flex flex-wrap items-start gap-4 p-5">
        <UnitTile large />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="location-heading" className="text-xl font-semibold text-zinc-900">
              {unit.label}
            </h2>
            <TypeChip>{unit.unitType}</TypeChip>
            <StorageLifecycleBadge archived={archived} showActive />
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 2xl:grid-cols-6">
            <HeaderDetail label="Type">{unit.unitType}</HeaderDetail>
            <HeaderDetail label="Storage type">{unit.storageType}</HeaderDetail>
            <HeaderDetail label="Parent location">{parent?.label ?? "Top level"}</HeaderDetail>
            <HeaderDetail label="Capacity">{unit.capacity === null ? "Not set" : unit.capacity.toLocaleString()}</HeaderDetail>
            <HeaderDetail label="Size">{unit.size ?? "Not specified"}</HeaderDetail>
            <HeaderDetail label="Holds specimens">{unit.holdsSpecimens ? "Yes" : "No"}</HeaderDetail>
          </dl>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-black/5 bg-sage-50/40 px-5 py-3">
        <span className="mr-1 text-xs font-semibold text-zinc-500">Quick actions</span>
        {archived ? (
          <span className="text-xs text-zinc-600">Archived locations are read-only.</span>
        ) : (
          <>
            <ModalButton
              key={`edit-${unit.id}`}
              title={`Edit ${unit.label}`}
              description="Every change is recorded in the audit log."
              size="lg"
              className={actionClasses}
              label={<ActionLabel icon={PencilIcon}>Edit</ActionLabel>}
            >
              <UpdateStorageLocationForm unit={unit} />
            </ModalButton>
            <ModalButton
              key={`add-inside-${unit.id}`}
              title={`Add a location inside ${unit.label}`}
              description="Every change is recorded in the audit log."
              size="lg"
              className={actionClasses}
              label={<ActionLabel icon={PlusIcon}>Add location inside</ActionLabel>}
            >
              <CreateStorageLocationForm units={units} parentId={unit.id} />
            </ModalButton>
            <ModalButton
              key={`move-${unit.id}`}
              title={`Move ${unit.label}`}
              description="Choose its new parent. The move is kept in its history."
              className={actionClasses}
              label={<ActionLabel icon={MoveIcon}>Move</ActionLabel>}
            >
              <MoveStorageLocationForm unit={unit} units={units} />
            </ModalButton>
          </>
        )}
        {!archived && (
          <ModalButton
            key={`archive-${unit.id}`}
            title={`Archive ${unit.label}?`}
            className={`${actionClasses} text-red-700 hover:border-red-200 hover:bg-red-50 sm:ml-auto`}
            label={<ActionLabel icon={ArchiveIcon}>Archive</ActionLabel>}
          >
            <ArchiveStorageLocationForm unit={unit} />
          </ModalButton>
        )}
      </div>
    </section>
  );
}

/** Stat cards for a room, cabinet or other unit that only holds other locations. */
function ContainerStats({
  unit,
  inside,
  totals,
  occupancyLoaded,
}: {
  unit: StorageUnit;
  inside: StorageUnit[];
  totals: StorageTotals | undefined;
  occupancyLoaded: boolean;
}) {
  const alerts = totals?.overCapacity.length ?? 0;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <StatCard icon={LayersIcon} label="Locations inside" value={inside.length.toLocaleString()} note={`Directly inside ${unit.label}`} />
      <StatCard
        icon={LeafIcon}
        label="Total specimens"
        value={totals ? totals.specimens.toLocaleString() : occupancyLoaded ? "0" : "—"}
        note={occupancyLoaded ? "In every unit inside" : "Totals unavailable right now"}
      />
      <StatCard
        icon={AlertTriangleIcon}
        label="Over capacity"
        value={occupancyLoaded ? alerts.toLocaleString() : "—"}
        note={alerts === 1 ? "Unit above its capacity" : "Units above their capacity"}
        tone={alerts > 0 ? "warning" : "default"}
      />
    </div>
  );
}

/** Stat cards, the specimen list and the category breakdown for a unit that holds specimen lots. */
function HoldingUnitOverview({
  unit,
  inventory,
  inventoryError,
  pending,
}: {
  unit: StorageUnit;
  inventory: StorageInventoryPage | null;
  inventoryError?: string;
  pending: boolean;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (pending) {
    return (
      <section role="status" className={`${cardClasses} p-5 text-sm text-zinc-500`}>
        Loading the specimens in {unit.label}…
      </section>
    );
  }
  if (!inventory) {
    return (
      <section role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        {inventoryError ?? "The specimens in this location could not be loaded."}
      </section>
    );
  }

  const groups = specimenGroups(inventory.items);
  const records = new Set(inventory.items.map((item) => item.specimen.id)).size;
  const partial = inventory.totalLots > inventory.items.length;
  const rows = inventory.items.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard icon={LeafIcon} label="Total specimens" value={inventory.totalQuantity.toLocaleString()} note={`Stored in ${unit.label}`} />
        <StatCard icon={ArchiveIcon} label="Specimen records" value={records.toLocaleString()} note="Catalogue records here" />
        <StatCard icon={LayersIcon} label="Categories" value={groups.length.toLocaleString()} note="Kinds of specimen" />
      </div>

      <section className={cardClasses} aria-labelledby="specimens-here-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pt-5">
          <h3 id="specimens-here-heading" className="text-sm font-semibold text-zinc-900">
            Specimens in {unit.label}
          </h3>
          {partial && (
            <p className="text-xs text-amber-800">
              Showing the first {inventory.items.length.toLocaleString()} of {inventory.totalLots.toLocaleString()} entries
            </p>
          )}
        </div>
        {inventory.items.length === 0 ? (
          <p className="px-5 pb-5 pt-3 text-sm text-zinc-500">No specimens are stored here yet.</p>
        ) : (
          <>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-xs">
                <thead className={tableHeadClasses}>
                  <tr>
                    {["Specimen", "Accession no.", "Scientific name", "Category", "Quantity", "Condition", "Status", "Last updated"].map((heading) => (
                      <th key={heading} scope="col" className="px-4 py-2.5 font-medium first:pl-5 last:pr-5">
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {rows.map(({ lot, specimen }) => (
                    <tr key={lot.id} className="text-zinc-700 hover:bg-sage-50/50">
                      <td className="px-4 py-2.5 pl-5">
                        <Link href={`/specimens/${specimen.id}`} className="font-semibold text-forest-800 hover:underline">
                          {specimen.commonName ?? specimen.scientificName ?? "Unnamed specimen"}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 font-mono">{specimen.accessionNumber ?? <span className="font-sans text-zinc-400">None yet</span>}</td>
                      <td className="px-4 py-2.5 italic">{specimen.scientificName ?? <span className="not-italic text-zinc-400">—</span>}</td>
                      <td className="px-4 py-2.5">{specimen.specimenCategory ?? <span className="text-zinc-400">—</span>}</td>
                      <td className="px-4 py-2.5 tabular-nums">{lot.quantity.toLocaleString()}</td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-full border border-forest-700/30 bg-forest-50 px-2 py-0.5 text-[0.6875rem] font-medium text-forest-800">
                          {lot.conditionClass}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{titleCase(specimen.status)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 pr-5 text-zinc-500">{formatDateTime(lot.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              className="border-t border-black/5 px-5 py-3"
              label={`Specimens in ${unit.label} pages`}
              noun="entries"
              page={page}
              pageSize={pageSize}
              total={inventory.items.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </section>

      {groups.length > 0 && (
        <section className={`${cardClasses} p-5`} aria-labelledby="specimen-groups-heading">
          <div className="flex items-baseline justify-between gap-2">
            <h3 id="specimen-groups-heading" className="text-sm font-semibold text-zinc-900">
              Specimen groups
            </h3>
            <p className="text-xs text-zinc-500">Specimens by category</p>
          </div>
          {/* A plain category and count list: easier to scan than cards, and no bars to read. */}
          <ul className="mt-3 grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <li key={group.category} className="flex items-center justify-between gap-3 border-b border-black/5 py-2.5 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-forest-600" aria-hidden="true" />
                  <span className={`truncate ${group.category === "Uncategorized" ? "text-zinc-500" : "text-zinc-800"}`}>
                    {group.category}
                  </span>
                </span>
                <span className="font-semibold tabular-nums text-zinc-900">{group.quantity.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/** The locations inside the selected one: a paged table and a layout of tiles. */
function ChildrenSection({
  parent,
  inside,
  units,
  totals,
  onSelect,
}: {
  parent: StorageUnit;
  inside: StorageUnit[];
  units: StorageUnit[];
  totals: Map<string, StorageTotals> | null;
  onSelect: (id: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const insideCount = (id: string) => units.filter((unit) => unit.parentId === id && !unit.archivedAt).length;
  const rows = inside.slice((page - 1) * pageSize, page * pageSize);
  const tiles = inside.slice(0, 7);
  const hiddenTiles = inside.length - tiles.length;

  return (
    <>
      <section className={cardClasses} aria-labelledby="inside-heading">
        <h3 id="inside-heading" className="px-5 pt-5 text-sm font-semibold text-zinc-900">
          Inside {parent.label}
        </h3>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-xs">
            <thead className={tableHeadClasses}>
              <tr>
                {["Location", "Type", "Storage type", "Locations inside", "Specimens", "Last updated"].map((heading) => (
                  <th key={heading} scope="col" className="px-4 py-2.5 font-medium first:pl-5 last:pr-5">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((child) => {
                const childTotals = totals?.get(child.id);
                return (
                  <tr key={child.id} className="text-zinc-700 hover:bg-sage-50/50">
                    <td className="px-4 py-2.5 pl-5">
                      <button type="button" onClick={() => onSelect(child.id)} className="flex items-center gap-2 font-semibold text-forest-800 hover:underline">
                        <UnitTile small />
                        {child.label}
                      </button>
                    </td>
                    <td className="px-4 py-2.5">{child.unitType}</td>
                    <td className="px-4 py-2.5">{child.storageType}</td>
                    <td className="px-4 py-2.5 tabular-nums">{insideCount(child.id)}</td>
                    <td className="px-4 py-2.5 tabular-nums">{childTotals ? childTotals.specimens.toLocaleString() : "—"}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 pr-5 text-zinc-500">{formatDateTime(child.updatedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePagination
          className="border-t border-black/5 px-5 py-3"
          label={`Locations inside ${parent.label} pages`}
          noun="locations"
          page={page}
          pageSize={pageSize}
          total={inside.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </section>

      <section className={`${cardClasses} p-5`} aria-labelledby="layout-heading">
        <h3 id="layout-heading" className="text-sm font-semibold text-zinc-900">
          Layout of {parent.label}
        </h3>
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {tiles.map((child) => {
            const over = (totals?.get(child.id)?.overCapacity.length ?? 0) > 0;
            return (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() => onSelect(child.id)}
                  className={`flex h-full w-full flex-col rounded-lg border p-3 text-left hover:bg-sage-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 ${
                    over ? "border-amber-400" : "border-forest-700/25"
                  }`}
                >
                  <span className="flex items-start gap-2">
                    <UnitTile small />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-zinc-900">{child.label}</span>
                      <span className="block truncate text-[0.6875rem] text-zinc-500">{child.storageType}</span>
                    </span>
                    {over && <AlertTriangleIcon className="ml-auto h-4 w-4 shrink-0 text-amber-600" aria-label="Over capacity" />}
                  </span>
                </button>
              </li>
            );
          })}
          {hiddenTiles > 0 && (
            <li className="flex flex-col items-center justify-center rounded-lg border border-dashed border-black/15 p-3 text-center text-xs text-zinc-600">
              <LayersIcon className="h-5 w-5 text-forest-700" />
              <span className="mt-1 font-semibold">+ {hiddenTiles} more</span>
              <span className="text-[0.6875rem] text-zinc-500">Listed in the table above</span>
            </li>
          )}
        </ul>
      </section>
    </>
  );
}

/**
 * Location moves and specimen-lot changes involving this location, newest first. Built from
 * labels and names only; an account or record id is never displayed.
 */
function ActivitySection({
  unit,
  entries,
  olderLotChanges,
  movementError,
  pending,
}: {
  unit: StorageUnit;
  entries: ActivityEntry[];
  /** Lot changes older than the newest 100, which are only in the full history. */
  olderLotChanges: number;
  movementError?: string;
  pending: boolean;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const shown = entries.slice((page - 1) * pageSize, page * pageSize);
  return (
    <section className={`${cardClasses} p-5`} aria-labelledby="activity-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h3 id="activity-heading" className="text-sm font-semibold text-zinc-900">
            Activity
          </h3>
          <InfoTip label="Activity" align="start">
            Specimen lots moved in or out, quantity and condition changes, and moves of this location. The audit log
            covers the location record itself: who created, edited, moved or archived it.
          </InfoTip>
        </div>
        <Link href={locationHistoryHref(unit.id)} className="text-xs font-semibold text-forest-800 hover:underline">
          View audit log
        </Link>
      </div>
      {pending ? (
        <p role="status" className="mt-3 text-sm text-zinc-500">Loading activity…</p>
      ) : (
        <>
          {movementError && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">{movementError}</p>}
          {entries.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No moves or specimen-lot changes recorded here yet.</p>
          ) : (
            <ol className="mt-3 divide-y divide-black/5">
              {shown.map((entry) => (
                <li key={entry.id} className="flex gap-3 py-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
                    {entry.id.startsWith("move-") ? <MoveIcon className="h-3.5 w-3.5" /> : <LeafIcon className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-medium text-zinc-900">{entry.title}</p>
                    {entry.detail && <p className="text-xs text-zinc-600">{entry.detail}</p>}
                  </div>
                  <p className="shrink-0 text-right text-[0.6875rem] text-zinc-500">
                    {entry.by && <span className="block font-medium text-zinc-600">{entry.by}</span>}
                    {formatDateTime(entry.at)}
                  </p>
                </li>
              ))}
            </ol>
          )}
          {entries.length > 0 && (
            <TablePagination
              className="-mx-5 -mb-5 mt-2 border-t border-black/5 px-5 py-3"
              label={`Activity for ${unit.label} pages`}
              noun="entries"
              page={page}
              pageSize={pageSize}
              total={entries.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
          {olderLotChanges > 0 && (
            <p className="mt-6 text-xs text-zinc-500">
              Only the newest 100 specimen-lot changes are listed; {olderLotChanges.toLocaleString()} older one
              {olderLotChanges === 1 ? " is" : "s are"} on each specimen&apos;s lot history.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function ArchiveVisibilityToggle({ showArchived, pending, onChange }: {
  showArchived: boolean; pending: boolean; onChange: (value: boolean) => void;
}) {
  return (
    <div className="mb-3 text-xs text-zinc-600" aria-busy={pending}>
      <label className="flex cursor-pointer items-center gap-2">
        <input type="checkbox" checked={showArchived} disabled={pending}
          onChange={event => onChange(event.target.checked)}
          className="h-4 w-4 accent-forest-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700" />
        Show archived locations
        <InfoTip label="Archived locations" align="start">
          Archived locations are kept for history and can&apos;t be changed. They appear in their own group below
          the active ones.
        </InfoTip>
      </label>
      {pending && <p role="status" className="mt-1">Updating location view…</p>}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "default",
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
  note: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className={`${cardClasses} flex items-center gap-3 p-4`}>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          tone === "warning" ? "bg-amber-50 text-amber-600" : "bg-forest-50 text-forest-700"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-zinc-500">{label}</p>
        <p className="text-xl font-semibold tabular-nums text-zinc-900">{value}</p>
        <p className="truncate text-[0.6875rem] text-zinc-500" title={note}>{note}</p>
      </div>
    </div>
  );
}

/** The cabinet-like tile standing in for a location photo, which locations do not have. */
function UnitTile({ large = false, small = false }: { large?: boolean; small?: boolean }) {
  const size = large ? "h-14 w-14" : small ? "h-6 w-6" : "h-10 w-10";
  const icon = large ? "h-7 w-7" : small ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <span aria-hidden="true" className={`flex ${size} shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700`}>
      <ArchiveIcon className={icon} />
    </span>
  );
}

function TypeChip({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-[0.625rem] font-medium text-zinc-600">{children}</span>
  );
}

function ActionLabel({ icon: Icon, children }: { icon: ComponentType<SVGProps<SVGSVGElement>>; children: ReactNode }) {
  return (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      {children}
    </>
  );
}

function HeaderDetail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-zinc-900">{children}</dd>
    </div>
  );
}

function GroupHeading({ children, className = "" }: { children: string; className?: string }) {
  return <p className={`mb-1 px-2.5 text-xs font-semibold text-zinc-500 ${className}`}>{children}</p>;
}

/** The location's own audit log. The id rides in a hidden filter, never the search box. */
function locationHistoryHref(id: string) {
  return `/audit-logs?affectedRecordType=storage_unit&affectedRecordId=${encodeURIComponent(id)}`;
}

function titleCase(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : dateTimeFormatter.format(date);
}
