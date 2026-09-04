import { Panel } from "@/components/dashboard/Panel";
import type { CatalogingActivityRow } from "@/lib/dummy-data/cataloging";

const STATUS_STYLES: Record<CatalogingActivityRow["status"], string> = {
  Cataloged: "bg-forest-100 text-forest-700",
  Draft: "bg-zinc-100 text-zinc-600",
  "Needs Review": "bg-sky-100 text-sky-700",
};

export function RecentCatalogingActivityTable({ rows }: { rows: CatalogingActivityRow[] }) {
  return (
    <Panel title="Recent Cataloging Activity" viewAllHref="/audit-logs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-xs text-zinc-500">
              <th className="py-2 pr-3 font-medium">Accession No.</th>
              <th className="py-2 pr-3 font-medium">Specimen</th>
              <th className="py-2 pr-3 font-medium">Updated By</th>
              <th className="py-2 pr-3 font-medium">Last Updated</th>
              <th className="py-2 pr-3 font-medium">Changes</th>
              <th className="py-2 pr-0 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {rows.map((row) => (
              <tr key={row.accessionNo + row.lastUpdated}>
                <td className="py-2.5 pr-3 font-medium whitespace-nowrap text-zinc-900">{row.accessionNo}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-700">{row.specimen}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{row.updatedBy}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-500">{row.lastUpdated}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{row.changes}</td>
                <td className="py-2.5 pr-0">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${STATUS_STYLES[row.status]}`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
