"use client";

import { useMemo, useState } from "react";
import { SearchIcon, InfoIcon, PlusIcon } from "@/components/icons";
import { LocationTree } from "./LocationTree";
import { LocationOverview } from "./LocationOverview";
import { LocationHeaderCard } from "./LocationHeaderCard";
import { LocationSelectedPanel } from "./LocationSelectedPanel";
import { AddLocationModal } from "./AddLocationModal";
import { LOCATIONS, findLocation, pathTo, flattenLocations } from "@/lib/dummy-data/locations";

export function LocationWorkspace() {
  const [selectedId, setSelectedId] = useState(LOCATIONS[0].id);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const selected = findLocation(selectedId) ?? LOCATIONS[0];
  const path = pathTo(selectedId) ?? [selected];
  const parent = path.length > 1 ? path[path.length - 2] : null;
  const room = path.find((n) => n.unitType === "Room") ?? null;

  const filteredFlat = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return flattenLocations().filter((n) => n.label.toLowerCase().includes(q) || n.code.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[300px_1fr_300px]">
      <div className="flex h-fit flex-col rounded-xl border border-black/10 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900">Storage Hierarchy</h3>
          <InfoIcon className="h-4 w-4 text-zinc-400" />
        </div>
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-sage-50 px-3 py-2.5 text-xs text-zinc-600">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-forest-600" />
          Specimens appear only for selected leaf units (drawer, jar, tray, box).
        </div>
        <div className="relative mb-3">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search locations..."
            className="w-full rounded-lg border border-black/15 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
        </div>

        <div className="max-h-[520px] flex-1 overflow-y-auto">
          {filteredFlat ? (
            <ul className="space-y-0.5">
              {filteredFlat.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(n.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm ${
                      n.id === selectedId ? "bg-forest-50 font-semibold text-forest-800" : "text-zinc-700 hover:bg-sage-50"
                    }`}
                  >
                    {n.label}
                    <span className="text-[10px] text-zinc-400">{n.unitType}</span>
                  </button>
                </li>
              ))}
              {filteredFlat.length === 0 && (
                <li className="py-6 text-center text-xs text-zinc-500">No locations match your search.</li>
              )}
            </ul>
          ) : (
            <LocationTree nodes={LOCATIONS} selectedId={selectedId} onSelect={setSelectedId} />
          )}
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-forest-700 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50"
        >
          <PlusIcon className="h-4 w-4" />
          Add Location
        </button>
      </div>

      <div className="min-w-0 space-y-4">
        <div>
          <p className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500">
            {path.map((n, i) => (
              <span key={n.id} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-zinc-300">/</span>}
                <button
                  type="button"
                  onClick={() => setSelectedId(n.id)}
                  className={i === path.length - 1 ? "font-medium text-forest-700" : "hover:text-forest-700"}
                >
                  {n.label}
                </button>
              </span>
            ))}
          </p>
          <LocationHeaderCard node={selected} parent={parent} room={room} />
        </div>
        <LocationOverview node={selected} onOpen={setSelectedId} />
      </div>

      <LocationSelectedPanel node={selected} parent={parent} room={room} onAddChild={() => setModalOpen(true)} />

      {modalOpen && (
        <AddLocationModal locations={LOCATIONS} initialParentId={selectedId} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
