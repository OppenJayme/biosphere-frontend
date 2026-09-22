import type { Metadata } from "next";
import { StatCard } from "@/components/ui/StatCard";
import { SpecimensWorkspace } from "@/components/specimens/SpecimensWorkspace";
import { STATS } from "@/lib/dummy-data/dashboard";
import { SPECIMENS, SPECIMEN_FILTERS } from "@/lib/dummy-data/specimens";

export const metadata: Metadata = {
  title: "Specimens",
};

export default function SpecimensPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Specimens</h1>
        <p className="mt-1 text-sm text-zinc-600">Browse, filter, and manage museum specimen records.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <SpecimensWorkspace specimens={SPECIMENS} filters={SPECIMEN_FILTERS} />
    </div>
  );
}
