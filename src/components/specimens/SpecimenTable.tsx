"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { PawIcon } from "@/components/icons";
import type { SpecimenSearchItem, SpecimenSummary } from "@/features/specimens/types";

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
  previewHref,
}: {
  specimens: SpecimenSearchItem[];
  selectedId: string | null;
  onSelect: (event: MouseEvent<HTMLElement>, id: string) => void;
  previewHref: (id: string) => string;
}) {
  if (specimens.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        No specimen records match the current search and filters.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1320px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="py-2 pr-3 font-medium">Record</th>
            <th className="py-2 pr-3 font-medium">Accession No.</th>
            <th className="py-2 pr-3 font-medium">Common Name</th>
            <th className="py-2 pr-3 font-medium">Scientific Name</th>
            <th className="py-2 pr-3 font-medium">Family</th>
            <th className="py-2 pr-3 font-medium">Category</th>
            <th className="py-2 pr-3 font-medium">Gender</th>
            <th className="py-2 pr-3 font-medium">Classification</th>
            <th className="py-2 pr-3 font-medium">Catalog Status</th>
            <th className="py-2 pr-3 text-right font-medium">Active Qty</th>
            <th className="py-2 pr-3 font-medium">Condition</th>
            <th className="py-2 pr-3 font-medium">Storage Location</th>
            <th className="py-2 pr-0 font-medium">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {specimens.map((specimen) => {
            const selected = specimen.id === selectedId;

            return (
              <tr
                key={specimen.id}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("a,button")) return;
                  onSelect(event, specimen.id);
                }}
                className={`cursor-pointer transition-colors ${selected ? "bg-forest-50" : "hover:bg-sage-50"}`}
              >
                <td className="py-2.5 pr-3">
                  <Link
                    href={`/specimens/${specimen.id}`}
                    prefetch={false}
                    aria-label={`View details for ${specimen.commonName ?? specimen.accessionNumber ?? "specimen"}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-100 text-forest-700 hover:bg-sage-200 focus-visible:outline-2 focus-visible:outline-forest-700"
                  >
                    <PawIcon className="h-4.5 w-4.5" />
                  </Link>
                </td>
                <td className="py-2.5 pr-3 font-medium whitespace-nowrap text-zinc-900">
                  {displayValue(specimen.accessionNumber)}
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-700">
                  <Link
                    href={previewHref(specimen.id)}
                    prefetch={false}
                    onClick={(event) => onSelect(event, specimen.id)}
                    aria-current={selected ? "true" : undefined}
                    className="underline decoration-forest-300 underline-offset-4 hover:text-forest-800 focus-visible:outline-2 focus-visible:outline-forest-700"
                  >
                    {specimen.commonName ?? specimen.accessionNumber ?? "Preview specimen"}
                  </Link>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap italic text-zinc-600">
                  {displayValue(specimen.scientificName)}
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">
                  {displayValue(specimen.family)}
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
                <td className="py-2.5 pr-3 text-right whitespace-nowrap text-zinc-700">
                  {specimen.totalQuantity.toLocaleString()}
                </td>
                <td className="py-2.5 pr-3 text-zinc-600">
                  {specimen.conditionClasses.length > 0
                    ? specimen.conditionClasses.join(", ")
                    : "—"}
                </td>
                <td className="max-w-64 py-2.5 pr-3 text-xs text-zinc-600">
                  {specimen.storageUnits.length > 0
                    ? specimen.storageUnits.map((unit) => (
                        <span key={unit.id} className="block">
                          {unit.pathLabel}
                        </span>
                      ))
                    : "—"}
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
