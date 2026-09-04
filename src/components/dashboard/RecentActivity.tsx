import { BugIcon, FishIcon, LeafIcon, SparkleIcon, MailIcon } from "@/components/icons";
import type { RECENT_ACTIVITY } from "@/lib/dummy-data/dashboard";

const ICONS = {
  bug: BugIcon,
  fish: FishIcon,
  leaf: LeafIcon,
  sparkle: SparkleIcon,
  mail: MailIcon,
} as const;

const TONE_STYLES: Record<(typeof RECENT_ACTIVITY)[number]["tone"], string> = {
  forest: "bg-forest-700 text-white",
  blue: "bg-sky-500 text-white",
  red: "bg-red-500 text-white",
  purple: "bg-violet-500 text-white",
  gold: "bg-gold-600 text-white",
};

export function RecentActivity({ items }: { items: readonly (typeof RECENT_ACTIVITY)[number][] }) {
  return (
    <ul className="flex flex-wrap gap-5">
      {items.map((item) => {
        const Icon = ICONS[item.icon];
        return (
          <li key={`${item.species}-${item.timestamp}`} className="flex min-w-[180px] flex-1 items-start gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${TONE_STYLES[item.tone]}`}
            >
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900">{item.action}</p>
              <p className="truncate text-xs italic text-zinc-500">{item.species}</p>
              <p className="text-xs text-zinc-400">By {item.by}</p>
              <p className="text-xs text-zinc-400">{item.timestamp}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
