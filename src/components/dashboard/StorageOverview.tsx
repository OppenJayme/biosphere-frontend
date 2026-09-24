/** Truthful dashboard summary derived from storage-unit metadata only. */

import { ArchiveIcon } from "@/components/icons";
import type { StorageOverviewItem } from "@/features/dashboard/types";

export function StorageOverview({ items }: { items: StorageOverviewItem[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        <span>Location</span>
        <span>Capacity</span>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
              <ArchiveIcon className="h-4.5 w-4.5" />
            </span>
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
