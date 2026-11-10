/** Truthful dashboard summary derived from storage-unit metadata only. */

import type { StorageOverviewItem } from "@/features/dashboard/types";

export function StorageOverview({ items }: { items: StorageOverviewItem[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-zinc-500">
        <span>Location</span>
        <span>Capacity</span>
      </div>
      <ul className="divide-y divide-black/5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-900">{item.location}</p>
              <p className="truncate text-[11px] text-zinc-500">
                {item.unitType} · {item.storageType}
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-zinc-600">
              {item.capacity === null ? "Not set" : item.capacity.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
