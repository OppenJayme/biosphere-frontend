import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Panel } from "@/components/dashboard/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { CatalogingTrendChart } from "@/components/dashboard/CatalogingTrendChart";
import { AttentionList } from "@/components/dashboard/AttentionList";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentSpecimensTable } from "@/components/dashboard/RecentSpecimensTable";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { OfflineSyncStatus } from "@/components/dashboard/OfflineSyncStatus";
import { getDashboardData } from "@/features/dashboard/api";
import { verifySession } from "@/lib/session";
import { ApiError } from "@/lib/api-client";
import { PageHeader, PAGE_ACTION_PRIMARY } from "@/components/curator/PageHeader";

export const metadata: Metadata = {
  title: "Dashboard",
};

// REQ-4.3-01: specimen status counts. Pending requests and duplicates appear in
// "Needs your attention" instead, as sentences with a button.
const COLLECTION_STAT_KEYS = ["total", "uncataloged", "cataloged", "archived"];

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
      <PageHeader
        title="Dashboard"
        description="What needs your attention today, and how the collection is doing."
        actions={
          <Link href="/specimens/new" className={PAGE_ACTION_PRIMARY}>
            Add specimen draft
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Needs your attention"
          info="Tasks waiting on a curator. Each one disappears from this list once nothing is left to do."
        >
          {data.attention.status === "ok" ? (
            <AttentionList items={data.attention.data} />
          ) : (
            <SectionError message="Waiting tasks could not be loaded. Refresh the page to try again." />
          )}
        </Panel>

        <Panel title="Quick actions">
          <QuickActions />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.stats.status === "ok" ? (
          data.stats.data
            .filter((stat) => COLLECTION_STAT_KEYS.includes(stat.key))
            .map((stat) => (
              <StatCard
                key={stat.key}
                label={stat.label}
                value={stat.value}
                note={stat.note}
                tone={stat.tone}
                icon={stat.icon}
                href={stat.href}
              />
            ))
        ) : (
          <div className="sm:col-span-2 xl:col-span-4">
            <SectionError message="Collection counts could not be loaded. Refresh the page to try again." />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel
          title="Specimens by collection type"
          collapseKey="collection-type"
          info="Counts specimen records by their category. The smallest categories are grouped under Others."
        >
          {data.collectionByType.status === "ok" ? (
            data.collectionByType.data.total > 0 ? (
              <DonutChart data={data.collectionByType.data.segments} total={data.collectionByType.data.total} />
            ) : (
              <SectionEmpty message="No specimen records yet." />
            )
          ) : (
            <SectionError message="The collection breakdown could not be loaded." />
          )}
        </Panel>

        <Panel
          title="New specimen records"
          collapseKey="cataloging-trend"
          info="How many specimen records were created each month over the last 12 months."
        >
          {data.catalogingTrend.status === "ok" ? (
            <CatalogingTrendChart data={data.catalogingTrend.data} />
          ) : (
            <SectionError message="The monthly chart could not be loaded." />
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Recent activity" viewAllHref="/audit-logs" collapseKey="recent-activity">
          {data.recentActivity.status === "ok" ? (
            data.recentActivity.data.length > 0 ? (
              <RecentActivity items={data.recentActivity.data} />
            ) : (
              <SectionEmpty message="No recent activity." />
            )
          ) : (
            <SectionError message="Recent activity could not be loaded." />
          )}
        </Panel>

        <Panel
          title="Offline drafts"
          collapseKey="offline-drafts"
          info="Specimen drafts created on this device without internet. They upload automatically when you are back online."
        >
          <OfflineSyncStatus ownerId={user.id} />
        </Panel>
      </div>

      <Panel title="Recently updated specimens" viewAllHref="/specimens" collapseKey="recent-specimens">
        {data.recentSpecimens.status === "ok" ? (
          data.recentSpecimens.data.length > 0 ? (
            <RecentSpecimensTable rows={data.recentSpecimens.data} />
          ) : (
            <SectionEmpty message="No specimen records yet." />
          )
        ) : (
          <SectionError message="Recent specimen records could not be loaded." />
        )}
      </Panel>
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
