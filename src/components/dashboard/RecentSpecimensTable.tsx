import { categoryIcon } from "./categoryIcon";
import type { RecentSpecimenRow, SpecimenCatalogStatus, SpecimenPublicStatus } from "@/features/dashboard/types";

const CATALOG_STATUS_STYLES: Record<SpecimenCatalogStatus, string> = {
  Cataloged: "bg-forest-100 text-forest-700",
  Uncataloged: "bg-zinc-100 text-zinc-600",
  Archived: "bg-amber-100 text-amber-700",
};

const PUBLIC_STATUS_STYLES: Record<SpecimenPublicStatus, string> = {
  Public: "bg-sky-100 text-sky-700",
  Restricted: "bg-red-100 text-red-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function RecentSpecimensTable({ rows }: { rows: RecentSpecimenRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="py-2 pr-3 font-medium">Accession No.</th>
            <th className="py-2 pr-3 font-medium">Specimen</th>
            <th className="py-2 pr-3 font-medium">Common Name</th>
            <th className="py-2 pr-3 font-medium">Storage Location</th>
            <th className="py-2 pr-3 font-medium">Condition</th>
            <th className="py-2 pr-3 font-medium">Catalog Status</th>
            <th className="py-2 pr-3 font-medium">Public Status</th>
            <th className="py-2 pr-0 font-medium">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {rows.map((row) => {
            const Icon = categoryIcon(row.category);
            return (
              <tr key={row.id}>
                <td className="py-2.5 pr-3 font-medium whitespace-nowrap text-zinc-900">
                  {row.accessionNo}
                </td>
                <td className="py-2.5 pr-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                    <Icon className="h-4 w-4" />
                  </span>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-700">{row.commonName}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{row.storageLocation ?? "—"}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{row.condition ?? "—"}</td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${CATALOG_STATUS_STYLES[row.catalogStatus]}`}
                  >
                    {row.catalogStatus}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${PUBLIC_STATUS_STYLES[row.publicStatus]}`}
                  >
                    {row.publicStatus}
                  </span>
                </td>
                <td className="py-2.5 pr-0 whitespace-nowrap text-zinc-500">{formatDate(row.lastUpdated)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
