import Link from "next/link";
import { PlusIcon, PencilIcon, ChartBarIcon, GridIcon } from "@/components/icons";
import type { QUICK_ACTIONS } from "@/lib/dummy-data/dashboard";

const ICONS = {
  plus: PlusIcon,
  pencil: PencilIcon,
  chart: ChartBarIcon,
  grid: GridIcon,
} as const;

export function QuickActions({ actions }: { actions: readonly (typeof QUICK_ACTIONS)[number][] }) {
  return (
    <ul className="space-y-1">
      {actions.map((action) => {
        const Icon = ICONS[action.icon];
        return (
          <li key={action.label}>
            <Link
              href={action.href}
              className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-sage-100 hover:text-forest-800"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                <Icon className="h-4 w-4" />
              </span>
              {action.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
