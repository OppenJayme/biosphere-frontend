"use client";

import { useState } from "react";
import Link from "next/link";
import { ExhibitToolbar } from "./ExhibitToolbar";
import { ExhibitTable } from "./ExhibitTable";
import { ExhibitDetailPanel } from "./ExhibitDetailPanel";
import { ExhibitEditor } from "./ExhibitEditor";
import { CreateExhibitModal } from "./CreateExhibitModal";
import type { Exhibit, ExhibitListQuery } from "@/features/exhibits-qr/types";

export function ExhibitsWorkspace({
  exhibits,
  query,
  filtered,
  selected,
  selectedError,
  errorMessage,
}: {
  exhibits: Exhibit[];
  query: ExhibitListQuery;
  filtered: boolean;
  selected: Exhibit | null;
  selectedError?: string;
  errorMessage?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      <ExhibitToolbar query={query} onAddClick={() => setModalOpen(true)} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
            {errorMessage ? (
              <p role="alert" className="py-8 text-center text-sm font-medium text-red-700">
                {errorMessage}
              </p>
            ) : exhibits.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-500">
                {filtered ? (
                  <>
                    No exhibits match these filters.{" "}
                    <Link href="/exhibits" className="font-semibold text-forest-700 underline">
                      Clear filters
                    </Link>
                  </>
                ) : (
                  "No exhibits yet. Create one from a Cataloged specimen approved for public display."
                )}
              </div>
            ) : (
              <ExhibitTable exhibits={exhibits} query={query} selectedId={selected?.id ?? null} />
            )}

            {!errorMessage && exhibits.length > 0 && (
              <p className="border-t border-black/10 pt-4 text-xs text-zinc-500">
                {exhibits.length} {filtered ? "matching" : "active"} exhibit{exhibits.length === 1 ? "" : "s"}.
                Archived exhibits are not listed.
              </p>
            )}
          </div>

          {selected && <ExhibitEditor exhibit={selected} />}
        </div>

        <div className="xl:self-start">
          <ExhibitDetailPanel exhibit={selected} query={query} selectedError={selectedError} />
        </div>
      </div>

      <CreateExhibitModal open={modalOpen} onClose={() => setModalOpen(false)} query={query} />
    </div>
  );
}
