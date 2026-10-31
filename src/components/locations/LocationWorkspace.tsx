/** Storage browser: active-first navigation with explicit, read-only archived history. */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArchiveIcon, ChevronDownIcon, ClockIcon, SearchIcon } from "@/components/icons";
import {
  buildStorageHierarchy,
  filterStorageUnits,
  storagePath,
} from "@/features/storage-locations/hierarchy";
import type { StorageMovement, StorageUnit } from "@/features/storage-locations/types";
import { storageBrowserHref, storageBrowserView } from "@/features/storage-locations/browser-view";
import { LocationTree } from "./LocationTree";
import { StorageLocationManagement } from "./StorageLocationManagement";
import { StorageMovementHistory } from "./StorageMovementHistory";
import { StorageLifecycleBadge } from "./StorageLifecycleBadge";
import { InfoTip } from "@/components/ui/InfoTip";

type LocationWorkspaceProps = {
  units: StorageUnit[];
  errorMessage?: string;
  initialSelectedId?: string;
  showArchived: boolean;
  movements: StorageMovement[];
  movementError?: string;
};

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function LocationWorkspace({
  units,
  errorMessage,
  initialSelectedId,
  showArchived,
  movements,
  movementError,
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
  const [query, setQuery] = useState("");
  const [hierarchyOpen, setHierarchyOpen] = useState(true);

  const selected = view.selected;
  const matches = useMemo(() => filterStorageUnits(view.visibleUnits, query), [query, view.visibleUnits]);
  const path = selected ? storagePath(units, selected.id) : [];

  const selectUnit = (id: string) => {
    if (id === selectedId || selectionPending) return;
    const target = units.find(unit => unit.id === id);
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
        <div className="rounded-xl border border-black/10 bg-white p-8 text-center">
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

  return (
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="flex h-fit flex-col rounded-xl border border-black/10 bg-white p-5">
        <h2 className={`text-sm font-semibold text-zinc-900 ${hierarchyOpen ? "mb-3" : ""}`}>
          <button
            type="button"
            onClick={() => setHierarchyOpen((open) => !open)}
            aria-expanded={hierarchyOpen}
            aria-controls="storage-hierarchy-body"
            className="-m-1 flex items-center gap-1.5 rounded-md p-1 text-left hover:text-forest-800 focus-visible:outline-2 focus-visible:outline-forest-600"
          >
            <ChevronDownIcon
              className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform motion-reduce:transition-none ${hierarchyOpen ? "" : "-rotate-90"}`}
            />
            Storage Hierarchy
          </button>
        </h2>
        <div id="storage-hierarchy-body" hidden={!hierarchyOpen}>
          <ArchiveVisibilityToggle showArchived={showArchived} pending={selectionPending} onChange={toggleArchived} />
          <label className="relative mb-3 block">
            <span className="sr-only">Search storage locations</span>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or type…"
              className="w-full rounded-lg border border-black/15 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
          </label>

          <div className="max-h-[560px] overflow-y-auto">
            {query.trim() ? (
              <ul className="space-y-0.5">
                {[...matches].sort((a, b) => Number(Boolean(a.archivedAt)) - Number(Boolean(b.archivedAt))).map((unit) => (
                  <li key={unit.id}>
                    <button
                      type="button"
                      onClick={() => selectUnit(unit.id)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
                        unit.id === selected.id
                          ? "bg-forest-50 font-semibold text-forest-800"
                          : "text-zinc-700 hover:bg-sage-50"
                      }`}
                    >
                      <span className="truncate">{unit.label}</span>
                      <StorageLifecycleBadge archived={Boolean(unit.archivedAt)} />
                      <span className="shrink-0 text-[10px] text-zinc-400">{unit.unitType}</span>
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
                <LocationTree nodes={hierarchy} selectedId={selected.id} onSelect={selectUnit} />
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
                              <span className="truncate text-[11px] font-normal text-zinc-500">
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
        </div>
      </aside>

      <main className="min-w-0 space-y-4">
        <nav aria-label="Storage location path" className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
          {path.map((unit, index) => (
            <span key={unit.id} className="flex items-center gap-1.5">
              {index > 0 && <span className="text-zinc-300">/</span>}
              <button
                type="button"
                onClick={() => selectUnit(unit.id)}
                className={`inline-flex items-center gap-1 ${index === path.length - 1 ? "font-medium text-forest-700" : "hover:text-forest-700"}`}
              >
                {unit.label}
                <StorageLifecycleBadge archived={Boolean(unit.archivedAt)} />
              </button>
            </span>
          ))}
        </nav>

        <section className="rounded-xl border border-black/10 bg-white p-5">
          <div className="flex flex-wrap items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
              <ArchiveIcon className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-zinc-900">{selected.label}</h2>
                <StorageLifecycleBadge archived={Boolean(selected.archivedAt)} showActive />
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {selected.unitType} &middot; {selected.storageType}
              </p>
            </div>
            <Link
              href={`/audit-logs?search=${encodeURIComponent(selected.id)}&affectedRecordType=storage_unit`}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-forest-700 px-3 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-50"
            >
              <ClockIcon className="h-4 w-4" />
              View audit history
            </Link>
          </div>

          <dl className="mt-5 grid gap-4 border-t border-black/10 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Parent" value={path.length > 1 ? path[path.length - 2].label : "Top level"} />
            <Detail label="Size" value={selected.size ?? "Not specified"} />
            <Detail label="Active direct children" value={String(view.activeChildren.length)} />
            {showArchived && <Detail label="Archived direct children" value={String(view.archivedChildren.length)} />}
            <Detail label="Can hold specimens" value={selected.holdsSpecimens ? "Yes" : "No"} />
            <Detail label="Capacity" value={selected.capacity === null ? "Not set" : String(selected.capacity)} />
            <Detail label="Created" value={formatDate(selected.createdAt)} />
            <Detail label="Last updated" value={formatDate(selected.updatedAt)} />
            {selected.archivedAt && <Detail label="Archived" value={formatDate(selected.archivedAt)} />}
          </dl>
        </section>

        <section className="rounded-xl border border-black/10 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900">Active child locations</h3>
          {view.activeChildren.length > 0 ? (
            <ChildLocationList units={view.activeChildren} onSelect={selectUnit} />
          ) : (
            <p className="mt-3 text-sm text-zinc-500">This location has no active child units.</p>
          )}
        </section>

        {showArchived && view.archivedChildren.length > 0 && (
          <section className="rounded-xl border border-black/10 bg-white p-5">
            <h3 className="text-sm font-semibold text-zinc-900">Archived child locations</h3>
            <ChildLocationList units={view.archivedChildren} onSelect={selectUnit} />
          </section>
        )}

        <StorageMovementHistory
          movements={movements}
          units={units}
          errorMessage={movementError}
          loading={selectionPending || selected.id !== initialSelectedId}
        />

        <StorageLocationManagement key={selected.id} selected={selected} units={units} />
      </main>

    </div>
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

function ChildLocationList({ units, onSelect }: { units: StorageUnit[]; onSelect: (id: string) => void }) {
  return (
    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
      {units.map(child => (
        <li key={child.id}>
          <button type="button" onClick={() => onSelect(child.id)}
            className={`flex w-full items-center gap-3 rounded-lg border border-black/10 p-3 text-left hover:border-forest-300 hover:bg-sage-50 ${child.archivedAt ? "bg-zinc-50" : ""}`}>
            <ArchiveIcon className="h-4 w-4 shrink-0 text-forest-700" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-zinc-900">{child.label}</span>
              <span className="block truncate text-xs text-zinc-500">{child.unitType}</span>
            </span>
            <StorageLifecycleBadge archived={Boolean(child.archivedAt)} />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

function GroupHeading({ children, className = "" }: { children: string; className?: string }) {
  return <p className={`mb-1 px-2.5 text-xs font-semibold text-zinc-500 ${className}`}>{children}</p>;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : dateFormatter.format(date);
}
