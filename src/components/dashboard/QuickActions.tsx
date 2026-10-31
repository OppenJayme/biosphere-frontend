import Link from "next/link";
import { PlusIcon, PencilIcon, ChartBarIcon, GridIcon, MailIcon, RefreshIcon } from "@/components/icons";

// REQ-4.3-04: add a specimen, review requests, open reports, and review
// offline drafts awaiting synchronization.
const ACTIONS = [
  { label: "Add new specimen", icon: PlusIcon, href: "/specimens/new" },
  { label: "Review requests", icon: MailIcon, href: "/public-website?status=PENDING" },
  { label: "Generate report", icon: ChartBarIcon, href: "/reports" },
  { label: "Review offline drafts", icon: RefreshIcon, href: "/specimens#offline-records-heading" },
  { label: "Continue cataloging", icon: PencilIcon, href: "/cataloging" },
  { label: "Create exhibit", icon: GridIcon, href: "/exhibits?create=1" },
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
