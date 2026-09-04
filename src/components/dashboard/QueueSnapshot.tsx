import { BugIcon, LizardIcon, LeafIcon, PawIcon, FishIcon } from "@/components/icons";
import type { CATALOGING_QUEUE } from "@/lib/dummy-data/dashboard";

const GROUP_ICONS = {
  insect: BugIcon,
  reptile: LizardIcon,
  botany: LeafIcon,
  mammal: PawIcon,
  marine: FishIcon,
} as const;

const STATUS_STYLES: Record<(typeof CATALOGING_QUEUE)[number]["status"], string> = {
  Draft: "bg-zinc-100 text-zinc-600",
  "Missing Fields": "bg-amber-100 text-amber-700",
  "Needs Review": "bg-sky-100 text-sky-700",
  "Possible Duplicate": "bg-red-100 text-red-700",
};

export function QueueSnapshot({ items }: { items: readonly (typeof CATALOGING_QUEUE)[number][] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const Icon = GROUP_ICONS[item.group];
        return (
          <li key={item.accessionNo} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-900">{item.accessionNo}</p>
              <p className="truncate text-xs italic text-zinc-500">{item.species}</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[item.status]}`}
            >
              {item.status}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
