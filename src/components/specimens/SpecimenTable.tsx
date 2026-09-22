"use client";

import { BugIcon, LizardIcon, LeafIcon, PawIcon, FishIcon } from "@/components/icons";
import type { Specimen } from "@/lib/dummy-data/specimens";

const GROUP_ICONS = {
  insect: BugIcon,
  reptile: LizardIcon,
  botany: LeafIcon,
  mammal: PawIcon,
  marine: FishIcon,
} as const;

const CONDITION_DOT: Record<Specimen["condition"], string> = {
  Good: "bg-forest-600",
  Fair: "bg-amber-500",
  Poor: "bg-red-500",
};

const CATALOG_STATUS_STYLES: Record<Specimen["catalogStatus"], string> = {
  Cataloged: "bg-forest-100 text-forest-700",
  Draft: "bg-zinc-100 text-zinc-600",
  "Needs Review": "bg-sky-100 text-sky-700",
  Archived: "bg-amber-100 text-amber-700",
};

export function SpecimenTable({
  specimens,
  selectedAccessionNo,
  onSelect,
}: {
  specimens: Specimen[];
  selectedAccessionNo: string | null;
  onSelect: (accessionNo: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="w-10 py-2 pr-3">
              <input type="checkbox" className="h-4 w-4 rounded border-black/20 accent-forest-700" />
            </th>
            <th className="py-2 pr-3 font-medium">Accession No.</th>
            <th className="py-2 pr-3 font-medium">Specimen</th>
            <th className="py-2 pr-3 font-medium">Common Name</th>
            <th className="py-2 pr-3 font-medium">Scientific Name</th>
            <th className="py-2 pr-3 font-medium">Family</th>
            <th className="py-2 pr-3 font-medium">Collection Type</th>
            <th className="py-2 pr-3 font-medium">Date Collection</th>
            <th className="py-2 pr-3 font-medium">Collector</th>
            <th className="py-2 pr-3 font-medium">Storage Location</th>
            <th className="py-2 pr-3 font-medium">Condition</th>
            <th className="py-2 pr-3 font-medium">Catalog Status</th>
            <th className="py-2 pr-0 font-medium">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {specimens.map((specimen) => {
            const Icon = GROUP_ICONS[specimen.group];
            const selected = specimen.accessionNo === selectedAccessionNo;
            return (
              <tr
                key={specimen.accessionNo}
                onClick={() => onSelect(specimen.accessionNo)}
                className={`cursor-pointer transition-colors ${selected ? "bg-forest-50" : "hover:bg-sage-50"}`}
              >
                <td className="py-2.5 pr-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="h-4 w-4 rounded border-black/20 accent-forest-700" />
                </td>
                <td className="py-2.5 pr-3 font-medium whitespace-nowrap text-zinc-900">
                  {specimen.accessionNo}
                </td>
                <td className="py-2.5 pr-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-700">{specimen.commonName}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap italic text-zinc-600">
                  {specimen.scientificName}
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{specimen.family}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{specimen.collectionType}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{specimen.dateCollection}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{specimen.collector}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{specimen.storageLocation}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap">
                  <span className="flex items-center gap-1.5 text-zinc-700">
                    <span className={`h-2 w-2 rounded-full ${CONDITION_DOT[specimen.condition]}`} />
                    {specimen.condition}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${CATALOG_STATUS_STYLES[specimen.catalogStatus]}`}
                  >
                    {specimen.catalogStatus}
                  </span>
                </td>
                <td className="py-2.5 pr-0 whitespace-nowrap text-zinc-500">{specimen.lastUpdated}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
