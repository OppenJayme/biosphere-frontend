"use client";

import { PawIcon } from "@/components/icons";
import type { SpecimenSummary } from "@/features/specimens/types";

const STATUS_STYLES: Record<SpecimenSummary["status"], string> = {
  UNCATALOGED: "bg-zinc-100 text-zinc-700",
  CATALOGED: "bg-forest-100 text-forest-700",
  ARCHIVED: "bg-amber-100 text-amber-700",
};

function displayValue(value: string | null) {
  return value ?? "—";
}

function statusLabel(status: SpecimenSummary["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : value.slice(0, 10);
}

export function SpecimenTable({
  specimens,
  selectedId,
  onSelect,
}: {
  specimens: SpecimenSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (specimens.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        No active specimen records match the current search and filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1020px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="py-2 pr-3 font-medium">Record</th>
            <th className="py-2 pr-3 font-medium">Accession No.</th>
            <th className="py-2 pr-3 font-medium">Common Name</th>
            <th className="py-2 pr-3 font-medium">Scientific Name</th>
            <th className="py-2 pr-3 font-medium">Category</th>
            <th className="py-2 pr-3 font-medium">Gender</th>
            <th className="py-2 pr-3 font-medium">Classification</th>
            <th className="py-2 pr-3 font-medium">Catalog Status</th>
            <th className="py-2 pr-0 font-medium">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {specimens.map((specimen) => {
            const selected = specimen.id === selectedId;

            return (
              <tr
                key={specimen.id}
                onClick={() => onSelect(specimen.id)}
                className={`cursor-pointer transition-colors ${selected ? "bg-forest-50" : "hover:bg-sage-50"}`}
              >
                <td className="py-2.5 pr-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                    <PawIcon className="h-4.5 w-4.5" />
                  </span>
                </td>
                <td className="py-2.5 pr-3 font-medium whitespace-nowrap text-zinc-900">
                  {displayValue(specimen.accessionNumber)}
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-700">
                  {displayValue(specimen.commonName)}
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap italic text-zinc-600">
                  {displayValue(specimen.scientificName)}
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">
                  {displayValue(specimen.specimenCategory)}
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">
                  {displayValue(specimen.gender)}
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">
                  {displayValue(specimen.classificationStatus)}
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${STATUS_STYLES[specimen.status]}`}
                  >
                    {statusLabel(specimen.status)}
                  </span>
                </td>
                <td className="py-2.5 pr-0 whitespace-nowrap text-zinc-500">
                  {formatDate(specimen.updatedAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
