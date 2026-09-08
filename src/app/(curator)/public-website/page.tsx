import type { Metadata } from "next";
import { StatCard } from "@/components/ui/StatCard";
import { PublicWebsiteWorkspace } from "@/components/public-website/PublicWebsiteWorkspace";
import { INQUIRIES, VISIT_REQUESTS, PUBLIC_WEBSITE_STATS } from "@/lib/dummy-data/public-website";

export const metadata: Metadata = {
  title: "Public Website",
};

export default function PublicWebsitePage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Public Website</h1>
        <p className="mt-1 text-sm text-zinc-600">Manage museum inquiries and visit requests from one place.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PUBLIC_WEBSITE_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <PublicWebsiteWorkspace inquiries={INQUIRIES} visitRequests={VISIT_REQUESTS} />
    </div>
  );
}
