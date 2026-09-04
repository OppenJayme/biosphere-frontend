import type { Metadata } from "next";
import { Panel } from "@/components/dashboard/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { CatalogingTrendChart } from "@/components/dashboard/CatalogingTrendChart";
import { QueueSnapshot } from "@/components/dashboard/QueueSnapshot";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentSpecimensTable } from "@/components/dashboard/RecentSpecimensTable";
import { StorageHealth } from "@/components/dashboard/StorageHealth";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PublicQrReadiness } from "@/components/dashboard/PublicQrReadiness";
import { DotsIcon, ChevronDownIcon } from "@/components/icons";
import {
  STATS,
  COLLECTION_BY_TYPE,
  COLLECTION_TOTAL,
  CATALOGING_TREND,
  CATALOGING_QUEUE,
  QUICK_ACTIONS,
  RECENT_SPECIMENS,
  STORAGE_HEALTH,
  RECENT_ACTIVITY,
  PUBLIC_QR_READINESS,
} from "@/lib/dummy-data/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Here&rsquo;s the current status of the collection, cataloging workflow, and storage
          today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel
          title="Specimen by Collection Type"
          action={
            <button type="button" aria-label="More options" className="text-zinc-400 hover:text-zinc-600">
              <DotsIcon className="h-4 w-4" />
            </button>
          }
        >
          <DonutChart data={COLLECTION_BY_TYPE} total={COLLECTION_TOTAL} />
        </Panel>

        <Panel
          title="Cataloging Process"
          action={
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-700"
            >
              Last 12 Months
              <ChevronDownIcon className="h-3.5 w-3.5" />
            </button>
          }
        >
          <p className="-mt-2 mb-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-forest-600" />
            Records Cataloged
          </p>
          <CatalogingTrendChart data={CATALOGING_TREND} />
        </Panel>

        <Panel title="Cataloging Queue Snapshot" viewAllHref="/cataloging">
          <QueueSnapshot items={CATALOGING_QUEUE} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[240px_1fr_320px]">
        <Panel title="Quick Actions">
          <QuickActions actions={QUICK_ACTIONS} />
        </Panel>

        <Panel title="Recent Specimen Records" viewAllHref="/specimens">
          <RecentSpecimensTable rows={RECENT_SPECIMENS} />
        </Panel>

        <Panel title="Collection Health / Storage Overview" viewAllHref="/storage">
          <StorageHealth items={STORAGE_HEALTH} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Panel title="Recent Cataloging Activity" viewAllHref="/audit-logs">
          <RecentActivity items={RECENT_ACTIVITY} />
        </Panel>

        <Panel title="Public QR Readiness" viewAllHref="/exhibits">
          <PublicQrReadiness items={PUBLIC_QR_READINESS} />
        </Panel>
      </div>
    </div>
  );
}
