"use client";

import Link from "next/link";
import { CloseIcon, PawIcon } from "@/components/icons";
import type { SpecimenSummary } from "@/features/specimens/types";

function displayValue(value: string | null) {
  return value ?? "Not recorded";
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : value.slice(0, 16).replace("T", " ");
}

export function SpecimenDetailPanel({
  specimen,
  onClear,
}: {
  specimen: SpecimenSummary | null;
  onClear: () => void;
}) {
  return (
    <aside className="rounded-xl border border-black/10 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Selected Specimen</h3>
        {specimen && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear selection"
            className="text-zinc-400 hover:text-zinc-600"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {!specimen ? (
        <p className="py-6 text-center text-xs text-zinc-500">
          Select a specimen from the table to view its recorded core details.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="flex aspect-4/3 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
            <PawIcon className="h-10 w-10" />
          </div>

          <div>
            <p className="text-xs font-medium text-zinc-500">
              {displayValue(specimen.accessionNumber)}
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {displayValue(specimen.commonName)}
            </p>
            <p className="text-xs italic text-zinc-500">
              {displayValue(specimen.scientificName)}
            </p>
          </div>

          <dl className="space-y-2 text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-400">Status</dt>
              <dd className="text-right font-medium text-zinc-800">{specimen.status}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-400">Category</dt>
              <dd className="text-right text-zinc-800">{displayValue(specimen.specimenCategory)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-400">Gender</dt>
              <dd className="text-right text-zinc-800">{displayValue(specimen.gender)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-400">Classification</dt>
              <dd className="text-right text-zinc-800">
                {displayValue(specimen.classificationStatus)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-400">Public display</dt>
              <dd className="text-right text-zinc-800">
                {specimen.publicDisplay ? "Eligible" : "Not eligible"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-400">Last updated</dt>
              <dd className="text-right text-zinc-800">{formatDate(specimen.updatedAt)}</dd>
            </div>
          </dl>

          {specimen.remarks && (
            <div>
              <p className="mb-1 text-xs text-zinc-400">Remarks</p>
              <p className="text-xs leading-5 text-zinc-700">{specimen.remarks}</p>
            </div>
          )}

          <Link
            href={`/specimens/${specimen.id}`}
            className="inline-flex w-full justify-center rounded-lg bg-forest-700 px-3 py-2 text-xs font-semibold text-white hover:bg-forest-800"
          >
            View full specimen details
          </Link>
        </div>
      )}
    </aside>
  );
}
