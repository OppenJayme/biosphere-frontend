"use client";

import { useMemo, useState } from "react";
import { SearchIcon, ArrowRightIcon, BugIcon, LizardIcon, LeafIcon, PawIcon, FishIcon } from "@/components/icons";
import type { QueueItem, QueueStatus } from "@/lib/dummy-data/cataloging";

const GROUP_ICONS = {
  insect: BugIcon,
  reptile: LizardIcon,
  botany: LeafIcon,
  mammal: PawIcon,
  marine: FishIcon,
} as const;

const STATUS_STYLES: Record<QueueStatus, string> = {
  Draft: "bg-zinc-100 text-zinc-600",
  "Missing Fields": "bg-amber-100 text-amber-700",
  "Needs Review": "bg-sky-100 text-sky-700",
  "Possible Duplicate": "bg-red-100 text-red-700",
  "Ready for QR": "bg-forest-100 text-forest-700",
};

const FILTERS: ("All" | QueueStatus)[] = [
  "All",
  "Draft",
  "Needs Review",
  "Missing Fields",
  "Possible Duplicate",
  "Ready for QR",
];

export function CatalogingQueue({
  items,
  selectedAccessionNo,
  onSelect,
}: {
  items: QueueItem[];
  selectedAccessionNo: string | null;
  onSelect: (accessionNo: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesFilter = filter === "All" || item.status === filter;
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        item.accessionNo.toLowerCase().includes(q) ||
        item.commonName.toLowerCase().includes(q) ||
        item.scientificName.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [items, filter, query]);

  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-black/10 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Cataloging Queue</h3>
        <span className="flex items-center gap-1 text-xs font-medium text-forest-700">
          view all
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </span>
      </div>

      <div className="relative mb-3">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search queue"
          className="w-full rounded-lg border border-black/15 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
              filter === f ? "bg-forest-700 text-white" : "border border-black/10 text-zinc-600 hover:bg-sage-100"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto">
        {filtered.map((item) => {
          const Icon = GROUP_ICONS[item.group];
          const selected = item.accessionNo === selectedAccessionNo;
          return (
            <li key={item.accessionNo}>
              <button
                type="button"
                onClick={() => onSelect(item.accessionNo)}
                className={`flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors ${
                  selected ? "bg-forest-50 ring-1 ring-forest-200" : "hover:bg-sage-50"
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-zinc-900">{item.accessionNo}</span>
                  <span className="block truncate text-xs italic text-zinc-500">{item.commonName}</span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-medium ${STATUS_STYLES[item.status]}`}
                >
                  {item.status}
                </span>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="py-6 text-center text-xs text-zinc-500">No queue items match your search.</li>
        )}
      </ul>

      <p className="mt-3 border-t border-black/10 pt-3 text-center text-[11px] text-zinc-400">
        Showing {filtered.length} of 186 records
      </p>
    </div>
  );
}
