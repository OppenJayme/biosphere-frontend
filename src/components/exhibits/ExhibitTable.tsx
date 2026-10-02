"use client";

import { ImageIcon } from "@/components/icons";
import { EXHIBIT_STATUS_LABELS, exhibitDisplayName, type ExhibitRow } from "@/features/exhibits-qr/types";
import { formatExhibitDate, STATUS_STYLES } from "./exhibit-format";

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
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="py-2 pr-3 font-medium">Exhibit / Specimen</th>
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
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                      <ImageIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium whitespace-nowrap text-zinc-900">{exhibitDisplayName(exhibit)}</p>
                      <p className="text-xs italic whitespace-nowrap text-zinc-500">
                        {exhibit.specimen ? (exhibit.specimen.scientificName ?? "—") : "Specimen details unavailable"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{exhibit.specimen?.accessionNumber ?? "—"}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">/exhibits/{exhibit.publicSlug}</td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${STATUS_STYLES[exhibit.status]}`}
                  >
                    {EXHIBIT_STATUS_LABELS[exhibit.status]}
                  </span>
                </td>
                <td className="py-2.5 pr-0 whitespace-nowrap text-zinc-500">{formatExhibitDate(exhibit.updatedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
