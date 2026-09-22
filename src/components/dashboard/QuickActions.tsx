import Link from "next/link";
import { PlusIcon, PencilIcon, ChartBarIcon, GridIcon } from "@/components/icons";

const ACTIONS = [
  { label: "Add new specimen", icon: PlusIcon, href: "/specimens/new" },
  { label: "Continue Cataloging", icon: PencilIcon, href: "/cataloging" },
  { label: "Generate Report", icon: ChartBarIcon, href: "/reports" },
  { label: "Create Exhibit", icon: GridIcon, href: "/exhibits/new" },
] as const;

export function QuickActions() {
  return (
    <ul className="space-y-1">
      {ACTIONS.map((action) => (
        <li key={action.label}>
          <Link
            href={action.href}
            className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-sage-100 hover:text-forest-800"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
              <action.icon className="h-4 w-4" />
            </span>
            {action.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
