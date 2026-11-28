import Link from "next/link";
import { PlusIcon, PencilIcon, ChartBarIcon, GridIcon, MailIcon, RefreshIcon } from "@/components/icons";
import { NAV_ACCENTS } from "@/components/curator/nav-accents";

// REQ-4.3-04: add a specimen, review requests, open reports, and review
// offline drafts awaiting synchronization.
// Each action takes the colour of the sidebar item it leads to.
const ACTIONS = [
  { label: "Add new specimen", icon: PlusIcon, href: "/specimens/new", accent: NAV_ACCENTS.specimens },
  { label: "Review requests", icon: MailIcon, href: "/public-website?status=PENDING", accent: NAV_ACCENTS.inquiries },
  { label: "Generate report", icon: ChartBarIcon, href: "/reports", accent: NAV_ACCENTS.reports },
  {
    label: "Review offline drafts",
    icon: RefreshIcon,
    href: "/specimens#offline-records-heading",
    accent: NAV_ACCENTS.specimens,
  },
  { label: "Continue cataloging", icon: PencilIcon, href: "/specimens?status=UNCATALOGED", accent: NAV_ACCENTS.cataloging },
  { label: "Create exhibit", icon: GridIcon, href: "/exhibits?create=1", accent: NAV_ACCENTS.exhibits },
] as const;

export function QuickActions() {
  return (
    <ul className="space-y-1">
      {ACTIONS.map((action) => (
        <li key={action.label}>
          <Link
            href={action.href}
            className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-sage-100 hover:text-forest-800"
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-100 text-zinc-500 transition-colors ${action.accent.hover}`}
            >
              <action.icon className="h-4 w-4" />
            </span>
            {action.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
