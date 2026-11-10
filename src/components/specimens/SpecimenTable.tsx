"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { EyeIcon } from "@/components/icons";
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

/**
 * Full storage paths repeat every parent ("Room 2 › Cabinet › Drawer A") and wrapped
 * into tall rows. Show the unit itself, with the full path on hover and in the
 * detail panel, and count any further lots' units.
 */
function StorageUnitsCell({ units }: { units: SpecimenSearchItem["storageUnits"] }) {
  if (units.length === 0) return <>—</>;
  const [first, ...rest] = units;
  return (
    <span title={units.map((unit) => unit.pathLabel).join(", ")}>
      {first.label}
      {rest.length > 0 && <span className="ml-1 text-xs text-zinc-500">+{rest.length} more</span>}
    </span>
  );
}

const DATE_ONLY = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DATE_ONLY.format(date);
}

export function SpecimenTable({
  specimens,
  selectedId,
  onSelect,
  onOpen,
  previewHref,
}: {
  specimens: SpecimenSearchItem[];
  selectedId: string | null;
  onSelect: (event: MouseEvent<HTMLElement>, id: string) => void;
  /** Double-click: open the full record. */
  onOpen: (id: string) => void;
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
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="py-2 pr-3 pl-3 font-medium">Accession No.</th>
            <th className="py-2 pr-3 font-medium">Specimen</th>
            <th className="py-2 pr-3 font-medium">Category</th>
            <th className="py-2 pr-3 font-medium">Catalog Status</th>
            <th className="py-2 pr-3 text-right font-medium">Qty</th>
            <th className="py-2 pr-3 font-medium">Storage</th>
            {/* Shown in the detail panel; the column only fits on wide screens. */}
            <th className="hidden py-2 pr-3 font-medium min-[1800px]:table-cell">Updated</th>
            <th className="py-2 pr-0">
              <span className="sr-only">Full details</span>
            </th>
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
                onDoubleClick={(event) => {
                  // The eye link already opens the record from its first click.
                  if ((event.target as HTMLElement).closest("[data-open-record]")) return;
                  onOpen(specimen.id);
                }}
                title="Click to preview. Double-click to open the full record."
                className={`cursor-pointer border-l-4 transition-colors ${
                  selected ? "border-forest-600 bg-forest-50" : "border-transparent hover:bg-sage-50"
                }`}
              >
                <td className="py-2.5 pr-3 pl-3 font-medium whitespace-nowrap text-zinc-900">
                  {specimen.accessionNumber ?? <span className="font-normal text-zinc-500">Unassigned</span>}
                </td>
                <td className="max-w-56 py-2.5 pr-3 text-zinc-700">
                  <Link
                    href={previewHref(specimen.id)}
                    prefetch={false}
                    onClick={(event) => onSelect(event, specimen.id)}
                    aria-current={selected ? "true" : undefined}
                    className="block truncate font-medium text-zinc-900 underline decoration-forest-300 underline-offset-4 hover:text-forest-800 focus-visible:outline-2 focus-visible:outline-forest-700"
                  >
                    {specimen.commonName ?? specimen.accessionNumber ?? "Preview specimen"}
                  </Link>
                  {specimen.scientificName && (
                    <span className="block truncate text-xs italic text-zinc-500">{specimen.scientificName}</span>
                  )}
                </td>
                <td className="max-w-32 py-2.5 pr-3 text-zinc-600">
                  {displayValue(specimen.specimenCategory)}
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${STATUS_STYLES[specimen.status]}`}
                  >
                    {statusLabel(specimen.status)}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right whitespace-nowrap tabular-nums text-zinc-700">
                  {specimen.totalQuantity.toLocaleString()}
                </td>
                <td className="max-w-36 truncate py-2.5 pr-3 whitespace-nowrap text-zinc-600">
                  <StorageUnitsCell units={specimen.storageUnits} />
                </td>
                <td className="hidden py-2.5 pr-3 whitespace-nowrap text-zinc-500 min-[1800px]:table-cell">
                  {formatDate(specimen.updatedAt)}
                </td>
                <td className="py-2.5 pr-0 text-right">
                  {/* A real link, so the full record opens without JavaScript and with modifier clicks. */}
                  <Link
                    href={`/specimens/${specimen.id}`}
                    prefetch={false}
                    data-open-record
                    aria-label={`View details for ${specimen.commonName ?? specimen.accessionNumber ?? "specimen"}`}
                    title="View full details"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-forest-700 hover:bg-forest-100 focus-visible:outline-2 focus-visible:outline-forest-700"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
