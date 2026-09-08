import type { Metadata } from "next";
import { StatCard } from "@/components/ui/StatCard";
import { ReportsWorkspace } from "@/components/reports/ReportsWorkspace";
import { AVAILABLE_REPORTS, REPORT_HISTORY, REPORT_STATS } from "@/lib/dummy-data/reports";

export const metadata: Metadata = {
  title: "Reports",
};

export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Reports</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Generate and export reports about specimens, collections, locations, and activities.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {REPORT_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <ReportsWorkspace reports={AVAILABLE_REPORTS} history={REPORT_HISTORY} />
    </div>
  );
}
