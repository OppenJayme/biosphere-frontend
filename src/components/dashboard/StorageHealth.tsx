import { ArchiveIcon } from "@/components/icons";
import type { STORAGE_HEALTH } from "@/lib/dummy-data/dashboard";

export function StorageHealth({ items }: { items: readonly (typeof STORAGE_HEALTH)[number][] }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        <span>Location</span>
        <span>Alerts</span>
      </div>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.location} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
              <ArchiveIcon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-zinc-900">{item.location}</p>
                <span className="shrink-0 text-xs text-zinc-500">Capacity {item.capacityPct}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full ${
                    item.capacityPct >= 90
                      ? "bg-red-500"
                      : item.capacityPct >= 75
                        ? "bg-amber-500"
                        : "bg-forest-600"
                  }`}
                  style={{ width: `${item.capacityPct}%` }}
                />
              </div>
            </div>
            <span
              className={`shrink-0 text-sm font-semibold ${item.alerts > 0 ? "text-red-600" : "text-forest-700"}`}
            >
              {item.alerts}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
