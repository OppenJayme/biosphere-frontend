"use client";

import { useState } from "react";
import {
  CloseIcon,
  ArrowRightIcon,
  CheckIcon,
  QrCodeIcon,
  PencilIcon,
  LizardIcon,
  BugIcon,
  LeafIcon,
  PawIcon,
  FishIcon,
} from "@/components/icons";
import type { CatalogEntryDetail } from "@/lib/dummy-data/cataloging";
import type { QueueItem } from "@/lib/dummy-data/cataloging";

const GROUP_ICONS = {
  insect: BugIcon,
  reptile: LizardIcon,
  botany: LeafIcon,
  mammal: PawIcon,
  marine: FishIcon,
} as const;

const PHOTO_COUNT = 4;

export function ValidationPreviewPanel({
  entry,
  group,
  onClose,
}: {
  entry: CatalogEntryDetail;
  group: QueueItem["group"];
  onClose: () => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const PhotoIcon = GROUP_ICONS[group];
  const doneCount = entry.checklist.filter((c) => c.done).length;

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-black/10 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Validation &amp; Preview</h3>
        <button type="button" onClick={onClose} aria-label="Close panel" className="text-zinc-400 hover:text-zinc-600">
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-lg bg-sage-100 text-forest-700">
        <PhotoIcon className="h-14 w-14" />
        <button
          type="button"
          onClick={() => setPhotoIndex((i) => (i - 1 + PHOTO_COUNT) % PHOTO_COUNT)}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow hover:bg-white"
        >
          <ArrowRightIcon className="h-4 w-4 rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => setPhotoIndex((i) => (i + 1) % PHOTO_COUNT)}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-600 shadow hover:bg-white"
        >
          <ArrowRightIcon className="h-4 w-4" />
        </button>
        <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
          {photoIndex + 1}/{PHOTO_COUNT}
        </span>
      </div>

      <p className="mt-3 text-xs font-medium text-zinc-500">{entry.accessionNo}</p>
      <p className="text-sm font-semibold text-zinc-900">
        {entry.commonName} <span className="font-normal italic text-zinc-500">({entry.scientificName})</span>
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-zinc-400">Collection Type</p>
          <p className="text-zinc-800">{entry.collectionName}</p>
        </div>
        <div>
          <p className="text-zinc-400">Storage Location</p>
          <p className="text-zinc-800">{entry.storageLocation}</p>
        </div>
        <div>
          <p className="text-zinc-400">Condition</p>
          <p className="flex items-center gap-1.5 text-zinc-800">
            <span className="h-2 w-2 rounded-full bg-forest-600" />
            {entry.condition}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-900">
            Cataloging Checklist
            <span className="text-forest-700">
              {doneCount}/{entry.checklist.length}
            </span>
          </p>
          <ul className="space-y-1.5">
            {entry.checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-1.5 text-xs text-zinc-700">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                  <CheckIcon className="h-2.5 w-2.5" />
                </span>
                {c.label}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-zinc-900">Duplicate Check</p>
          <ul className="space-y-2">
            {entry.duplicates.map((dup, i) => {
              const DupIcon = GROUP_ICONS[dup.group];
              return (
                <li key={`${dup.accessionNo}-${i}`} className="flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sage-100 text-forest-700">
                    <DupIcon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11px] font-medium text-zinc-800">{dup.commonName}</span>
                    <span className="block text-[10px] text-zinc-400">{dup.similarityPct}% similar</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <button type="button" className="mt-1.5 text-[11px] font-medium text-forest-700 hover:text-forest-800">
            View all matches
          </button>
        </div>
      </div>

      <div className="mt-4 border-t border-black/10 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-900">QR / Exhibit Preview &mdash; Active</p>
          <button type="button" aria-label="Edit exhibit preview" className="text-zinc-400 hover:text-zinc-600">
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex gap-3 rounded-lg bg-sage-50 p-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-white text-forest-700">
            <QrCodeIcon className="h-8 w-8" />
          </span>
          <div className="min-w-0 text-xs">
            <p className="font-semibold text-zinc-900">{entry.commonName}</p>
            <p className="italic text-zinc-500">{entry.scientificName}</p>
            <p className="mt-1 text-zinc-600">Habitat: {entry.qrHabitat}</p>
            <p className="text-zinc-600">Ecological Role: {entry.qrEcologicalRole}</p>
            <button type="button" className="mt-1 font-medium text-forest-700 hover:text-forest-800">
              Show more
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-black/10 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-900">Recent Activity</p>
          <span className="flex items-center gap-1 text-[11px] font-medium text-forest-700">
            view all
            <ArrowRightIcon className="h-3 w-3" />
          </span>
        </div>
        <ul className="space-y-2.5">
          {entry.recentActivity.map((activity) => (
            <li key={activity.timestamp + activity.description} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-600" />
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500">{activity.timestamp}</p>
                <p className="text-xs text-zinc-800">{activity.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
