"use client";

import { useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "@/components/icons";
import type { ExhibitRow, ExhibitStatus } from "@/features/exhibits-qr/types";
import { ExhibitToolbar } from "./ExhibitToolbar";
import { ExhibitTable } from "./ExhibitTable";
import { ExhibitDetailPanel } from "./ExhibitDetailPanel";
import { CreateExhibitModal } from "./CreateExhibitModal";

const PAGE_SIZES = [5, 10, 25];

export type ExhibitNotice = { tone: "success" | "error"; message: string };

type ModalState = { mode: "create" } | { mode: "edit"; exhibitId: string } | null;

function matches(row: ExhibitRow, term: string) {
  if (!term) return true;
  return [row.specimen?.commonName, row.specimen?.scientificName, row.specimen?.accessionNumber, row.publicSlug].some(
    (value) => value?.toLowerCase().includes(term),
  );
}

/** Page numbers to show: first, last, and a window around the current page. */
function pageList(current: number, count: number): (number | "gap")[] {
  const pages = new Set([1, count, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= count).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

export function ExhibitsWorkspace({
  exhibits,
  initialSelectedId,
}: {
  exhibits: ExhibitRow[];
  initialSelectedId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ExhibitStatus | "">("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const [selectedId, setSelectedId] = useState<string | null>(
    exhibits.some((e) => e.id === initialSelectedId) ? initialSelectedId : (exhibits[0]?.id ?? null),
  );
  const [modal, setModal] = useState<ModalState>(null);
  const [notice, setNotice] = useState<ExhibitNotice | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return exhibits.filter((row) => (!status || row.status === status) && matches(row, term));
  }, [exhibits, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = exhibits.find((e) => e.id === selectedId) ?? null;
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
        onAddClick={() => setModal({ mode: "create" })}
      />

      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            notice.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          <p>{notice.message}</p>
          <button type="button" onClick={() => setNotice(null)} className="shrink-0 text-xs font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-xs text-zinc-500">
            <p>
              {filtered.length === 0
                ? "Showing 0 exhibits"
                : `Showing ${(currentPage - 1) * pageSize + 1} to ${(currentPage - 1) * pageSize + visible.length} of ${filtered.length} exhibits`}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-sage-100 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
              </button>
              {pageList(currentPage, pageCount).map((item, index) =>
                item === "gap" ? (
                  <span key={`gap-${index}`} className="px-1">
                    &hellip;
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    aria-current={item === currentPage ? "page" : undefined}
                    className={`flex h-7 w-7 items-center justify-center rounded-md font-medium ${
                      item === currentPage ? "border border-forest-700 text-forest-700" : "text-zinc-600 hover:bg-sage-100"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 hover:bg-sage-100 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="relative">
              <select
                aria-label="Exhibits per page"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="appearance-none rounded-md border border-black/15 bg-white py-1 pl-2.5 pr-7 text-xs text-zinc-700 focus:border-forest-700 focus:outline-none"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size} / page
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>
        </div>

        <ExhibitDetailPanel
          key={selected?.id ?? "none"}
          exhibit={selected}
          onClear={() => setSelectedId(null)}
          onEdit={(id) => setModal({ mode: "edit", exhibitId: id })}
          onNotice={setNotice}
          onArchived={() => setSelectedId(null)}
        />
      </div>

      {(modal?.mode === "create" || editing) && (
        <CreateExhibitModal
          key={editing?.id ?? "create"}
          exhibit={editing}
          onClose={() => setModal(null)}
          onSaved={(id, message) => {
            setSelectedId(id);
            setModal(null);
            setNotice({ tone: "success", message });
          }}
        />
      )}
    </div>
  );
}
