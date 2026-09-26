/** Interactive, read-only view of storage units already managed by the backend. */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArchiveIcon, ClockIcon, InfoIcon, SearchIcon } from "@/components/icons";
import {
  buildStorageHierarchy,
  filterStorageUnits,
  storagePath,
} from "@/features/storage-locations/hierarchy";
import type { StorageMovement, StorageUnit } from "@/features/storage-locations/types";
import { LocationTree } from "./LocationTree";
import { StorageLocationManagement } from "./StorageLocationManagement";
import { StorageMovementHistory } from "./StorageMovementHistory";

type LocationWorkspaceProps = {
  units: StorageUnit[];
  errorMessage?: string;
  initialSelectedId?: string;
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
  movements,
  movementError,
}: LocationWorkspaceProps) {
  const router = useRouter();
  const [selectionPending, startSelectionTransition] = useTransition();
  const hierarchy = useMemo(() => buildStorageHierarchy(units), [units]);
  const unitById = useMemo(() => new Map(units.map((unit) => [unit.id, unit])), [units]);
  const [selectedId, setSelectedId] = useState(
    initialSelectedId && unitById.has(initialSelectedId)
      ? initialSelectedId
      : hierarchy[0]?.id ?? units[0]?.id ?? "",
  );
  const [query, setQuery] = useState("");

  const selected = unitById.get(selectedId) ?? hierarchy[0] ?? units[0];
  const matches = useMemo(() => filterStorageUnits(units, query), [query, units]);
  const path = selected ? storagePath(units, selected.id) : [];
  const children = selected
    ? units
        .filter((unit) => unit.parentId === selected.id)
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }))
    : [];

  const selectUnit = (id: string) => {
    if (id === selectedId) return;
    setSelectedId(id);
    startSelectionTransition(() => {
      router.replace(`/storage?selected=${encodeURIComponent(id)}`, { scroll: false });
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
        <div className="rounded-xl border border-black/10 bg-white p-8 text-center">
          <ArchiveIcon className="mx-auto h-8 w-8 text-zinc-300" />
          <p className="mt-3 text-sm font-semibold text-zinc-900">No storage locations yet</p>
          <p className="mt-1 text-sm text-zinc-500">Create the first top-level storage location below.</p>
        </div>
        <StorageLocationManagement units={units} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr_300px]">
      <aside className="flex h-fit flex-col rounded-xl border border-black/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Storage Hierarchy</h2>
          <InfoIcon className="h-4 w-4 text-zinc-400" />
        </div>
        <p className="mb-3 rounded-lg bg-sage-50 px-3 py-2.5 text-xs text-zinc-600">
          Types and parent relationships are curator-managed; this view does not assume a fixed hierarchy.
        </p>
        <label className="relative mb-3 block">
          <span className="sr-only">Search storage locations</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, type, or ID..."
            className="w-full rounded-lg border border-black/15 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
        </label>

        <div className="max-h-[560px] overflow-y-auto">
          {query.trim() ? (
            <ul className="space-y-0.5">
              {matches.map((unit) => (
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
                    <span className="shrink-0 text-[10px] text-zinc-400">{unit.unitType}</span>
                  </button>
                </li>
              ))}
              {matches.length === 0 && (
                <li className="py-6 text-center text-xs text-zinc-500">No storage locations match that search.</li>
              )}
            </ul>
          ) : (
            <LocationTree nodes={hierarchy} selectedId={selected.id} onSelect={selectUnit} />
          )}
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
                className={index === path.length - 1 ? "font-medium text-forest-700" : "hover:text-forest-700"}
              >
                {unit.label}
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
                <LifecycleBadge archived={Boolean(selected.archivedAt)} />
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {selected.unitType} &middot; {selected.storageType}
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-4 border-t border-black/10 pt-5 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="Parent" value={path.length > 1 ? path[path.length - 2].label : "Top level"} />
            <Detail label="Size" value={selected.size ?? "Not specified"} />
            <Detail label="Direct children" value={String(children.length)} />
            <Detail label="Can hold specimens" value={selected.holdsSpecimens ? "Yes" : "No"} />
            <Detail label="Capacity" value={selected.capacity === null ? "Not set" : String(selected.capacity)} />
          </dl>
        </section>

        <section className="rounded-xl border border-black/10 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900">Direct child locations</h3>
          {children.length > 0 ? (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {children.map((child) => (
                <li key={child.id}>
                  <button
                    type="button"
                    onClick={() => selectUnit(child.id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-black/10 p-3 text-left hover:border-forest-300 hover:bg-sage-50"
                  >
                    <ArchiveIcon className="h-4 w-4 shrink-0 text-forest-700" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-zinc-900">{child.label}</span>
                      <span className="block truncate text-xs text-zinc-500">{child.unitType}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">This location has no direct child units.</p>
          )}
        </section>

        <StorageMovementHistory
          movements={movements}
          units={units}
          errorMessage={movementError}
          loading={selectionPending || selected.id !== initialSelectedId}
        />

        <StorageLocationManagement key={selected.id} selected={selected} units={units} />
      </main>

      <aside className="h-fit rounded-xl border border-black/10 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-900">Record details</h3>
        <dl className="mt-4 space-y-3 border-t border-black/10 pt-4">
          <Detail label="Storage unit ID" value={selected.id} breakAll />
          <Detail label="Created" value={formatDate(selected.createdAt)} />
          <Detail label="Last updated" value={formatDate(selected.updatedAt)} />
          {selected.archivedAt && <Detail label="Archived" value={formatDate(selected.archivedAt)} />}
        </dl>
        <Link
          href={`/audit-logs?search=${encodeURIComponent(selected.id)}&affectedRecordType=storage_unit`}
          className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-forest-700 px-3 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-50"
        >
          <ClockIcon className="h-4 w-4" />
          View audit history
        </Link>
      </aside>
    </div>
  );
}

function LifecycleBadge({ archived }: { archived: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        archived ? "bg-zinc-100 text-zinc-600" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {archived ? "Archived" : "Active"}
    </span>
  );
}

function Detail({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-zinc-400">{label}</dt>
      <dd className={`mt-0.5 text-sm font-medium text-zinc-900 ${breakAll ? "break-all font-mono text-xs" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : dateFormatter.format(date);
}
