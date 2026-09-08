"use client";

import Image from "next/image";
import { CheckIcon, CloseIcon } from "@/components/icons";
import type { Exhibit } from "@/lib/dummy-data/exhibits";

const PUBLISH_STYLES: Record<Exhibit["publishStatus"], string> = {
  Published: "bg-forest-100 text-forest-700",
  Draft: "bg-zinc-100 text-zinc-600",
  "Needs Review": "bg-amber-100 text-amber-700",
};

export function ExhibitTable({
  exhibits,
  selectedSlug,
  onSelect,
}: {
  exhibits: Exhibit[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="py-2 pr-3 font-medium">Exhibit / Specimen</th>
            <th className="py-2 pr-3 font-medium">Accession No.</th>
            <th className="py-2 pr-3 font-medium">QR Status</th>
            <th className="py-2 pr-3 font-medium">Publish Status</th>
            <th className="py-2 pr-3 font-medium">AR</th>
            <th className="py-2 pr-0 font-medium">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {exhibits.map((exhibit) => {
            const selected = exhibit.slug === selectedSlug;
            return (
              <tr
                key={exhibit.slug}
                onClick={() => onSelect(exhibit.slug)}
                className={`cursor-pointer border-l-4 transition-colors ${
                  selected ? "border-forest-600 bg-forest-50" : "border-transparent hover:bg-sage-50"
                }`}
              >
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-3">
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-sage-100">
                      <Image
                        src={exhibit.images[0]}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium whitespace-nowrap text-zinc-900">{exhibit.commonName}</p>
                      <p className="text-xs italic whitespace-nowrap text-zinc-500">{exhibit.scientificName}</p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{exhibit.accessionNo}</td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
                      exhibit.qrEnabled ? "bg-forest-100 text-forest-700" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {exhibit.qrEnabled ? "QR Enabled" : "Not Generated"}
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${PUBLISH_STYLES[exhibit.publishStatus]}`}
                  >
                    {exhibit.publishStatus}
                  </span>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap">
                  {exhibit.arEnabled ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-forest-700">
                      <CheckIcon className="h-3.5 w-3.5" />
                      Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <CloseIcon className="h-3.5 w-3.5" />
                      No
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-0 whitespace-nowrap text-zinc-500">
                  <p>{exhibit.updatedAt}</p>
                  <p className="text-xs text-zinc-400">{exhibit.updatedBy}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
