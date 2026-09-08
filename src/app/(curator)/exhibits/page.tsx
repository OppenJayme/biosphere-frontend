import type { Metadata } from "next";
import { StatCard } from "@/components/ui/StatCard";
import { ExhibitsWorkspace } from "@/components/exhibits/ExhibitsWorkspace";
import { EXHIBITS, EXHIBIT_FILTERS, EXHIBIT_STATS } from "@/lib/dummy-data/exhibits";

export const metadata: Metadata = {
  title: "QR Exhibits",
};

export default function ExhibitsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Exhibits</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Create, manage, publish, and print QR-enabled specimen exhibits.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {EXHIBIT_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <ExhibitsWorkspace exhibits={EXHIBITS} filters={EXHIBIT_FILTERS} />
    </div>
  );
}
