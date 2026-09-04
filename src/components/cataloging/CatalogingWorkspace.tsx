"use client";

import { useState } from "react";
import { CatalogingQueue } from "./CatalogingQueue";
import { CatalogEntryForm } from "./CatalogEntryForm";
import { ValidationPreviewPanel } from "./ValidationPreviewPanel";
import { DEFAULT_CATALOG_ENTRY, CATALOG_ENTRIES, type QueueItem } from "@/lib/dummy-data/cataloging";

export function CatalogingWorkspace({ queue }: { queue: QueueItem[] }) {
  const [selectedAccessionNo, setSelectedAccessionNo] = useState(queue[0]?.accessionNo ?? "");
  const [panelOpen, setPanelOpen] = useState(true);

  const selectedItem = queue.find((item) => item.accessionNo === selectedAccessionNo) ?? queue[0];
  const entry = CATALOG_ENTRIES[selectedAccessionNo] ?? {
    ...DEFAULT_CATALOG_ENTRY,
    accessionNo: selectedItem.accessionNo,
    commonName: selectedItem.commonName,
    scientificName: selectedItem.scientificName,
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr_320px]">
      <CatalogingQueue items={queue} selectedAccessionNo={selectedAccessionNo} onSelect={setSelectedAccessionNo} />
      <CatalogEntryForm entry={entry} />
      {panelOpen ? (
        <ValidationPreviewPanel entry={entry} group={selectedItem.group} onClose={() => setPanelOpen(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="h-fit rounded-xl border border-dashed border-black/15 px-3 py-4 text-xs font-medium text-zinc-500 hover:bg-sage-50"
        >
          Show Validation &amp; Preview
        </button>
      )}
    </div>
  );
}
