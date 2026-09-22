import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
import { DotsIcon } from "@/components/icons";
import { getDashboardData } from "@/features/dashboard/api";
import { verifySession } from "@/lib/session";
import { ApiError } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await verifySession();
  if (!user) redirect("/login?from=/dashboard");

  let data;
  try {
    data = await getDashboardData();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login?from=/dashboard");
    }
    throw error;
  }

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
        {data.stats.status === "ok" ? (
          data.stats.data.map((stat) => (
            <StatCard key={stat.key} label={stat.label} value={stat.value} note={stat.note} tone={stat.tone} icon={stat.icon} />
          ))
        ) : (
          <div className="sm:col-span-2 xl:col-span-4">
            <SectionError message="Stats are temporarily unavailable." />
          </div>
        )}
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
          {data.collectionByType.status === "ok" ? (
            data.collectionByType.data.total > 0 ? (
              <DonutChart data={data.collectionByType.data.segments} total={data.collectionByType.data.total} />
            ) : (
              <SectionEmpty message="No specimen records yet." />
            )
          ) : (
            <SectionError message="Collection breakdown is temporarily unavailable." />
          )}
        </Panel>

        <Panel
          title="Cataloging Process"
          action={
            <span className="text-xs font-medium text-zinc-500">Specimens created &middot; last 12 months</span>
          }
        >
          <p className="-mt-2 mb-2 flex items-center gap-1.5 text-xs text-zinc-500">
            <span className="h-2 w-2 rounded-full bg-forest-600" />
            Records Created
          </p>
          {data.catalogingTrend.status === "ok" ? (
            <CatalogingTrendChart data={data.catalogingTrend.data} />
          ) : (
            <SectionError message="The cataloging trend is temporarily unavailable." />
          )}
        </Panel>

        <Panel title="Uncataloged Queue Snapshot" viewAllHref="/cataloging">
          {data.catalogingQueue.status === "ok" ? (
            data.catalogingQueue.data.length > 0 ? (
              <QueueSnapshot items={data.catalogingQueue.data} />
            ) : (
              <SectionEmpty message="Nothing waiting to be cataloged." />
            )
          ) : (
            <SectionError message="The cataloging queue is temporarily unavailable." />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[240px_1fr_320px]">
        <Panel title="Quick Actions">
          <QuickActions />
        </Panel>

        <Panel title="Recent Specimen Records" viewAllHref="/specimens">
          {data.recentSpecimens.status === "ok" ? (
            data.recentSpecimens.data.length > 0 ? (
              <RecentSpecimensTable rows={data.recentSpecimens.data} />
            ) : (
              <SectionEmpty message="No specimen records yet." />
            )
          ) : (
            <SectionError message="Recent specimen records are temporarily unavailable." />
          )}
        </Panel>

        <Panel title="Collection Health / Storage Overview" viewAllHref="/storage">
          {data.storageHealth.status === "ok" ? (
            data.storageHealth.data.length > 0 ? (
              <StorageHealth items={data.storageHealth.data} />
            ) : (
              <SectionEmpty message="No specimen-holding storage units yet." />
            )
          ) : (
            <SectionError message="Storage health is temporarily unavailable." />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <Panel title="Recent Cataloging Activity" viewAllHref="/audit-logs">
          {data.recentActivity.status === "ok" ? (
            data.recentActivity.data.length > 0 ? (
              <RecentActivity items={data.recentActivity.data} />
            ) : (
              <SectionEmpty message="No recent activity." />
            )
          ) : (
            <SectionError message="Recent activity is temporarily unavailable." />
          )}
        </Panel>

        <Panel title="Public QR Readiness" viewAllHref="/exhibits">
          <PublicQrReadiness />
        </Panel>
      </div>
    </div>
  );
}

function SectionError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      {message}
    </div>
  );
}

function SectionEmpty({ message }: { message: string }) {
  return <p className="py-6 text-center text-sm text-zinc-500">{message}</p>;
}
