"use client";

import { useState } from "react";
import { SpecimenToolbar } from "./SpecimenToolbar";
import { SpecimenTable } from "./SpecimenTable";
import { SpecimenDetailPanel } from "./SpecimenDetailPanel";
import { AddSpecimenModal } from "./AddSpecimenModal";
import type { Specimen, SPECIMEN_FILTERS } from "@/lib/dummy-data/specimens";

export function SpecimensWorkspace({
  specimens,
  filters,
}: {
  specimens: Specimen[];
  filters: typeof SPECIMEN_FILTERS;
}) {
  const [selectedAccessionNo, setSelectedAccessionNo] = useState<string | null>(
    specimens[0]?.accessionNo ?? null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  const selected = specimens.find((s) => s.accessionNo === selectedAccessionNo) ?? null;

  return (
    <div className="space-y-4">
      <SpecimenToolbar filters={filters} onAddClick={() => setModalOpen(true)} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 rounded-xl border border-black/10 bg-white p-5">
          <SpecimenTable
            specimens={specimens}
            selectedAccessionNo={selectedAccessionNo}
            onSelect={setSelectedAccessionNo}
          />
        </div>

        <SpecimenDetailPanel specimen={selected} onClear={() => setSelectedAccessionNo(null)} />
      </div>

      <AddSpecimenModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
