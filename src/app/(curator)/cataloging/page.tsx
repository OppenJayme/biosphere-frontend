import type { Metadata } from "next";
import { StatCard } from "@/components/ui/StatCard";
import { CatalogingWorkspace } from "@/components/cataloging/CatalogingWorkspace";
import { RecentCatalogingActivityTable } from "@/components/cataloging/RecentCatalogingActivityTable";
import { CATALOGING_STATS, CATALOGING_QUEUE, RECENT_CATALOGING_ACTIVITY } from "@/lib/dummy-data/cataloging";

export const metadata: Metadata = {
  title: "Cataloging",
};

export default function CatalogingPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Cataloging</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Here&rsquo;s the current status of the collection, cataloging workflow, and storage today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {CATALOGING_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <CatalogingWorkspace queue={CATALOGING_QUEUE} />

      <RecentCatalogingActivityTable rows={RECENT_CATALOGING_ACTIVITY} />
    </div>
  );
}
