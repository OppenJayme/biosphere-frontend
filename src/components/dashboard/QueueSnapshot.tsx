import type { QueueItem } from "@/features/dashboard/types";

export function QueueSnapshot({ items }: { items: QueueItem[] }) {
  return (
    <ul className="divide-y divide-black/5">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-zinc-900">{item.accessionNo}</p>
            <p className="truncate text-xs italic text-zinc-500">{item.species}</p>
          </div>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-[0.6875rem] font-medium text-zinc-600">
            Uncataloged
          </span>
        </li>
      ))}
    </ul>
  );
}
