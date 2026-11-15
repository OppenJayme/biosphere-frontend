"use client";

import { useMemo, useState } from "react";
import { TABLE_PAGE_SIZES, TablePagination } from "@/components/ui/TablePagination";
import { notify } from "@/components/ui/toast";
import type { ExhibitRow, ExhibitStatus } from "@/features/exhibits-qr/types";
import { ExhibitToolbar, type ArFilter } from "./ExhibitToolbar";
import { ExhibitTable } from "./ExhibitTable";
import { ExhibitDetailPanel } from "./ExhibitDetailPanel";
import { CreateExhibitModal } from "./CreateExhibitModal";

export type ExhibitNotice = { tone: "success" | "error"; message: string };

type ModalState = { mode: "create" } | { mode: "edit"; exhibitId: string } | null;

/** "With AR" means a developer has uploaded at least one AR model, whether or not View in AR is on. */
function hasAr(row: ExhibitRow) {
  return row.arAssetCount > 0;
}

/** Every action in this workspace reports its result as a toast. */
function showNotice(notice: ExhibitNotice) {
  notify(notice.tone, notice.message);
}

function matches(row: ExhibitRow, term: string) {
  if (!term) return true;
  return [row.specimen?.commonName, row.specimen?.scientificName, row.specimen?.accessionNumber, row.publicSlug].some(
    (value) => value?.toLowerCase().includes(term),
  );
}

export function ExhibitsWorkspace({
  exhibits,
  initialSelectedId,
  openCreate = false,
}: {
  exhibits: ExhibitRow[];
  initialSelectedId: string | null;
  /** Opens the create dialog on arrival, e.g. from the dashboard's "Create exhibit" action. */
  openCreate?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ExhibitStatus | "">("");
  const [ar, setAr] = useState<ArFilter>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(TABLE_PAGE_SIZES[0]);
  const [selectedId, setSelectedId] = useState<string | null>(
    exhibits.some((e) => e.id === initialSelectedId) ? initialSelectedId : (exhibits[0]?.id ?? null),
  );
  const [modal, setModal] = useState<ModalState>(openCreate ? { mode: "create" } : null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return exhibits.filter(
      (row) =>
        (!status || row.status === status) && (!ar || hasAr(row) === (ar === "with")) && matches(row, term),
    );
  }, [exhibits, search, status, ar]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = exhibits.find((e) => e.id === selectedId) ?? null;
  const statusCounts = { PUBLISHED: 0, UNPUBLISHED: 0, DISABLED: 0 };
  for (const exhibit of exhibits) statusCounts[exhibit.status] += 1;
  const withArCount = exhibits.filter(hasAr).length;
  const editing = modal?.mode === "edit" ? (exhibits.find((e) => e.id === modal.exhibitId) ?? null) : null;

  return (
    <div className="space-y-4">
      <ExhibitToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        counts={statusCounts}
        ar={ar}
        onArChange={(value) => {
          setAr(value);
          setPage(1);
        }}
        arCounts={{ with: withArCount, without: exhibits.length - withArCount }}
        onAddClick={() => setModal({ mode: "create" })}
      />

      {/* items-start + a sticky, self-scrolling detail panel: the long panel no longer
          stretches the row and leaves empty space under a short exhibit list. */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4 rounded-xl border border-black/10 bg-white p-5">
          {visible.length > 0 ? (
            <ExhibitTable exhibits={visible} selectedId={selectedId} onSelect={setSelectedId} />
          ) : (
            <p className="py-10 text-center text-sm text-zinc-500">
              {exhibits.length === 0
                ? "No exhibits yet. Create one from a Cataloged specimen approved for public display."
                : "No exhibits match your search or filter."}
            </p>
          )}

          <TablePagination
            label="Exhibit pages"
            noun="exhibits"
            page={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>

        <div className="xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto xl:rounded-xl">
          <ExhibitDetailPanel
            key={selected?.id ?? "none"}
            exhibit={selected}
            onClear={() => setSelectedId(null)}
            onEdit={(id) => setModal({ mode: "edit", exhibitId: id })}
            onNotice={showNotice}
            onArchived={() => setSelectedId(null)}
          />
        </div>
      </div>

      {(modal?.mode === "create" || editing) && (
        <CreateExhibitModal
          key={editing?.id ?? "create"}
          exhibit={editing}
          onClose={() => setModal(null)}
          onSaved={(id, message) => {
            setSelectedId(id);
            setModal(null);
            showNotice({ tone: "success", message });
          }}
        />
      )}
    </div>
  );
}
