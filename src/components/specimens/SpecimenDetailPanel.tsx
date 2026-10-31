"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { CloseIcon } from "@/components/icons";
import { SpecimenCoverPreview } from "./SpecimenCoverPreview";
import type { SpecimenSearchItem } from "@/features/specimens/types";

function displayValue(value: string | null) {
  return value ?? "Not recorded";
}

const DATE_TIME = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not recorded" : DATE_TIME.format(date);
}

function statusLabel(status: SpecimenSearchItem["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-zinc-500">{label}</dt>
      <dd className="min-w-0 text-right text-zinc-800">{children}</dd>
    </div>
  );
}

export function SpecimenDetailPanel({
  specimen,
  onClear,
  clearHref,
}: {
  specimen: SpecimenSearchItem | null;
  onClear: (event: MouseEvent<HTMLAnchorElement>) => void;
  clearHref: string;
}) {
  return (
    <aside
      id="selected-specimen"
      className="h-fit scroll-mt-20 rounded-xl border border-black/10 bg-white p-5 xl:sticky xl:top-20"
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Selected Specimen</h3>
        {specimen && (
          <Link
            href={clearHref}
            prefetch={false}
            onClick={onClear}
            aria-label="Clear selection"
            className="text-zinc-400 hover:text-zinc-600"
          >
            <CloseIcon className="h-4 w-4" />
          </Link>
        )}
      </div>

      <p role="status" className="sr-only">
        {specimen
          ? `Selected ${specimen.commonName ?? specimen.accessionNumber ?? "specimen"}`
          : "Selection cleared"}
      </p>

      {!specimen ? (
        <p className="py-6 text-center text-xs text-zinc-500">
          Select a specimen from the table to view its recorded core details.
        </p>
      ) : (
        <div className="space-y-4">
          <SpecimenCoverPreview
            key={`${specimen.id}:${specimen.updatedAt}`}
            specimenId={specimen.id}
            alt={`Cover image of ${specimen.commonName ?? specimen.scientificName ?? "selected specimen"}`}
          />

          <div>
            <p className="text-xs font-medium text-zinc-500">
              {displayValue(specimen.accessionNumber)}
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              {displayValue(specimen.commonName)}
            </p>
            <p className="text-xs italic text-zinc-500">{displayValue(specimen.scientificName)}</p>
          </div>

          <dl className="space-y-2 text-xs">
            <Row label="Status">{statusLabel(specimen.status)}</Row>
            <Row label="Category">{displayValue(specimen.specimenCategory)}</Row>
            <Row label="Family">{displayValue(specimen.family)}</Row>
            <Row label="Gender">{displayValue(specimen.gender)}</Row>
            <Row label="Classification">{displayValue(specimen.classificationStatus)}</Row>
            <Row label="Public display">{specimen.publicDisplay ? "Eligible" : "Not eligible"}</Row>
            <Row label="Active quantity">{specimen.totalQuantity.toLocaleString()}</Row>
            <Row label="Condition">
              {specimen.conditionClasses.length > 0 ? specimen.conditionClasses.join(", ") : "Not recorded"}
            </Row>
            <Row label="Storage">
              {specimen.storageUnits.length > 0
                ? specimen.storageUnits.map((unit) => (
                    <span key={unit.id} className="block break-words">
                      {unit.pathLabel}
                    </span>
                  ))
                : "Not stored"}
            </Row>
            <Row label="Last updated">{formatDate(specimen.updatedAt)}</Row>
          </dl>

          {specimen.remarks && (
            <div>
              <p className="mb-1 text-xs text-zinc-500">Remarks</p>
              <p className="text-xs leading-5 text-zinc-700">{specimen.remarks}</p>
            </div>
          )}

          <Link
            href={`/specimens/${specimen.id}`}
            className="inline-flex w-full justify-center rounded-lg bg-forest-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
          >
            View full specimen details
          </Link>
        </div>
      )}
    </aside>
  );
}
