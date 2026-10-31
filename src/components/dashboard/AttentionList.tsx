import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import type { AttentionItem } from "@/features/dashboard/types";

/** "Needs your attention": one sentence and one button per waiting task. */
export function AttentionList({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2 py-4 text-sm text-zinc-600">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-100 text-forest-700">
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
        Nothing is waiting for you right now.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-black/5">
      {items.map((item) => (
        <li key={item.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
          <p className="text-sm text-zinc-800">{item.text}</p>
          <Link
            href={item.href}
            className="shrink-0 rounded-lg border border-forest-700 px-3 py-1.5 text-sm font-semibold text-forest-800 hover:bg-forest-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
          >
            {item.action}
          </Link>
        </li>
      ))}
    </ul>
  );
}
