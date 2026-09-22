import { categoryIcon } from "./categoryIcon";
import type { QueueItem } from "@/features/dashboard/types";

export function QueueSnapshot({ items }: { items: QueueItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const Icon = categoryIcon(item.category);
        return (
          <li key={item.id} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-900">{item.accessionNo}</p>
              <p className="truncate text-xs italic text-zinc-500">{item.species}</p>
            </div>
            <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
              Uncataloged
            </span>
          </li>
        );
      })}
    </ul>
  );
}
