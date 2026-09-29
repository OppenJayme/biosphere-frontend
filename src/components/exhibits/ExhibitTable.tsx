"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, CloseIcon, QrCodeIcon } from "@/components/icons";
import { exhibitsHref } from "@/features/exhibits-qr/form";
import type { Exhibit, ExhibitListQuery } from "@/features/exhibits-qr/types";
import { timestampParts } from "@/features/public-submissions/format";
import { ExhibitStatusBadge } from "./ExhibitParts";

export function ExhibitTable({
  exhibits,
  query,
  selectedId,
}: {
  exhibits: Exhibit[];
  query: ExhibitListQuery;
  selectedId: string | null;
}) {
  const router = useRouter();
  const hrefFor = (id: string) => exhibitsHref(query, { selected: id });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th scope="col" className="py-2 pr-3 font-medium">Exhibit / Specimen</th>
            <th scope="col" className="py-2 pr-3 font-medium">Accession No.</th>
            <th scope="col" className="py-2 pr-3 font-medium">Public URL</th>
            <th scope="col" className="py-2 pr-3 font-medium">Status</th>
            <th scope="col" className="py-2 pr-3 font-medium">AR</th>
            <th scope="col" className="py-2 pr-0 font-medium">Last Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {exhibits.map((exhibit) => {
            const selected = exhibit.id === selectedId;
            const updated = timestampParts(exhibit.updatedAt);
            return (
              <tr
                key={exhibit.id}
                onClick={() => router.push(hrefFor(exhibit.id), { scroll: false })}
                aria-selected={selected}
                className={`cursor-pointer border-l-4 transition-colors ${
                  selected ? "border-forest-600 bg-forest-50" : "border-transparent hover:bg-sage-50"
                }`}
              >
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                      <QrCodeIcon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={hrefFor(exhibit.id)}
                        scroll={false}
                        onClick={(event) => event.stopPropagation()}
                        className="font-medium whitespace-nowrap text-zinc-900 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700"
                      >
                        {exhibit.specimen.commonName ?? "Unnamed specimen"}
                      </Link>
                      <p className="text-xs italic whitespace-nowrap text-zinc-500">
                        {exhibit.specimen.scientificName ?? "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">
                  {exhibit.specimen.accessionNumber ?? "—"}
                </td>
                <td className="max-w-44 py-2.5 pr-3 font-mono text-xs break-all text-zinc-600">
                  /exhibits/{exhibit.publicSlug}
                </td>
                <td className="py-2.5 pr-3">
                  <ExhibitStatusBadge status={exhibit.status} />
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap">
                  {exhibit.arEnabled ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-forest-700">
                      <CheckIcon className="h-3.5 w-3.5" />
                      On
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <CloseIcon className="h-3.5 w-3.5" />
                      {exhibit.arAssetCount > 0 ? "Off" : "No model"}
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-0 whitespace-nowrap text-zinc-500">
                  <p>{updated.date}</p>
                  <p className="text-xs text-zinc-400">{updated.time}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
