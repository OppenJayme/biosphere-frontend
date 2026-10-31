import type { ComponentType, SVGProps } from "react";
import {
  PawIcon,
  ArchiveIcon,
  ClipboardIcon,
  MailIcon,
  CalendarIcon,
  ChatIcon,
  ShieldIcon,
  RefreshIcon,
  SparkleIcon,
  AlertTriangleIcon,
  LockIcon,
  CubeIcon,
  ChartBarIcon,
} from "@/components/icons";
import type { ActivityItem } from "@/features/dashboard/types";

const MODULE_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  specimens: PawIcon,
  specimen_lots: PawIcon,
  storage_locations: ArchiveIcon,
  audit: ClipboardIcon,
  inquiries: MailIcon,
  visit_requests: CalendarIcon,
  faq: ChatIcon,
  developer: ShieldIcon,
  offline_sync: RefreshIcon,
  auth: LockIcon,
  exhibits: CubeIcon,
  reports: ChartBarIcon,
  backup: ArchiveIcon,
};

// Server-rendered: pin museum time so the result never depends on the server's zone.
const TIMESTAMP_FORMAT = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

function formatTimestamp(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "Unknown time" : TIMESTAMP_FORMAT.format(date);
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="divide-y divide-black/5">
      {items.map((item) => {
        const Icon = item.failed ? AlertTriangleIcon : (MODULE_ICONS[item.module] ?? SparkleIcon);
        return (
          <li key={item.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                item.failed ? "bg-red-100 text-red-700" : "bg-sage-100 text-forest-700"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <p className="min-w-0 flex-1 pt-1.5 text-sm text-zinc-800">{item.summary}</p>
            <time dateTime={item.timestamp} className="shrink-0 pt-1.5 text-xs whitespace-nowrap text-zinc-500">
              {formatTimestamp(item.timestamp)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
