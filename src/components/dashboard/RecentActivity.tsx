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
};

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <ul className="flex flex-wrap gap-5">
      {items.map((item) => {
        const Icon = item.failed ? AlertTriangleIcon : (MODULE_ICONS[item.module] ?? SparkleIcon);
        return (
          <li key={item.id} className="flex min-w-[180px] flex-1 items-start gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                item.failed ? "bg-red-500 text-white" : "bg-forest-700 text-white"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900">{item.action}</p>
              <p className="truncate text-xs italic text-zinc-500">{item.detail}</p>
              <p className="text-xs text-zinc-400">By {item.by}</p>
              <p className="text-xs text-zinc-400">{formatTimestamp(item.timestamp)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
