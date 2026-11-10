"use client";

import { EXHIBIT_STATUS_LABELS, exhibitDisplayName, type ExhibitRow } from "@/features/exhibits-qr/types";
import { STATUS_STYLES } from "./exhibit-format";

const DATE_ONLY = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });

// The table shows the day only; the detail panel keeps the full time.
function formatDateOnly(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_ONLY.format(date);
}

export function ExhibitTable({
  exhibits,
  selectedId,
  onSelect,
}: {
  exhibits: ExhibitRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="py-2 pr-3 pl-3 font-medium">Exhibit / Specimen</th>
            <th className="py-2 pr-3 font-medium">Accession No.</th>
            <th className="py-2 pr-3 font-medium">Public URL</th>
            <th className="py-2 pr-3 font-medium">Publish Status</th>
            <th className="py-2 pr-0 font-medium">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {exhibits.map((exhibit) => {
            const selected = exhibit.id === selectedId;
            return (
              <tr
                key={exhibit.id}
                onClick={() => onSelect(exhibit.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(exhibit.id);
                  }
                }}
                tabIndex={0}
                aria-selected={selected}
                className={`cursor-pointer border-l-4 transition-colors focus:outline-none focus-visible:bg-sage-50 ${
                  selected ? "border-forest-600 bg-forest-50" : "border-transparent hover:bg-sage-50"
                }`}
              >
                <td className="py-2.5 pr-3 pl-3">
                  <p className="font-medium whitespace-nowrap text-zinc-900">{exhibitDisplayName(exhibit)}</p>
                  <p className="text-xs italic whitespace-nowrap text-zinc-500">
                    {exhibit.specimen ? (exhibit.specimen.scientificName ?? "—") : "Specimen details unavailable"}
                  </p>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{exhibit.specimen?.accessionNumber ?? "—"}</td>
                <td className="max-w-52 truncate py-2.5 pr-3 whitespace-nowrap text-zinc-600" title={`/exhibits/${exhibit.publicSlug}`}>
                  /exhibits/{exhibit.publicSlug}
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${STATUS_STYLES[exhibit.status]}`}
                  >
                    {EXHIBIT_STATUS_LABELS[exhibit.status]}
                  </span>
                </td>
                <td className="py-2.5 pr-0 whitespace-nowrap text-zinc-500">{formatDateOnly(exhibit.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
