"use client";

import { useMemo, useState } from "react";
import { PlusIcon, SearchIcon } from "@/components/icons";
import {
  filterCachedSpecimens,
  getCachedSpecimenCategories,
  type CachedSpecimenStatusFilter,
} from "../filters";
import type { OfflineSpecimenDraft, SpecimenDraftData } from "../types";
import { useOfflineSpecimens } from "../use-offline-specimens";
import { OfflineSpecimenDraftModal } from "./OfflineSpecimenDraftModal";

const STATE_LABELS = {
  PENDING_SYNC: "Pending Sync",
  SYNCHRONIZING: "Synchronizing",
  SYNCHRONIZED: "Synchronized",
  SYNC_FAILED: "Sync Failed",
} as const;

const STATE_STYLES = {
  PENDING_SYNC: "bg-amber-100 text-amber-800",
  SYNCHRONIZING: "bg-sky-100 text-sky-800",
  SYNCHRONIZED: "bg-forest-100 text-forest-800",
  SYNC_FAILED: "bg-red-100 text-red-800",
} as const;

function displayName(draft: OfflineSpecimenDraft) {
  return (
    draft.draft.accessionNumber ??
    draft.draft.scientificName ??
    draft.draft.commonName ??
    "Unnamed specimen draft"
  );
}

export function OfflineSpecimenPanel({ ownerId }: { ownerId: string }) {
  const {
    cachedSpecimens,
    discardDraft,
    drafts,
    isSynchronizing,
    online,
    retryDraft,
    saveDraft,
    synchronizeAll,
  } = useOfflineSpecimens(ownerId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<OfflineSpecimenDraft | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<CachedSpecimenStatusFilter>("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const categoryOptions = useMemo(
    () => getCachedSpecimenCategories(cachedSpecimens),
    [cachedSpecimens],
  );
  const visibleCache = useMemo(
    () =>
      filterCachedSpecimens(cachedSpecimens, {
        search,
        status: statusFilter,
        category: categoryFilter,
      }),
    [cachedSpecimens, categoryFilter, search, statusFilter],
  );

  const filtersActive =
    search.trim().length > 0 || statusFilter !== "ALL" || categoryFilter !== "";

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setCategoryFilter("");
  }

  async function handleSave(data: SpecimenDraftData, clientDraftId?: string) {
    await saveDraft(data, clientDraftId);
    setNotice(
      online
        ? "Draft saved locally. It will synchronize over the stable connection."
        : "Draft saved locally and marked Pending Sync.",
    );
  }

  async function handleDiscard(draft: OfflineSpecimenDraft) {
    const confirmed = window.confirm(
      draft.syncState === "SYNCHRONIZED"
        ? "Remove this local sync receipt? The server specimen will not be deleted."
        : "Discard this local draft? This cannot be undone.",
    );
    if (!confirmed) return;
    try {
      await discardDraft(draft.clientDraftId);
      setNotice("The local draft was removed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The draft could not be removed.");
    }
  }

  function openNewDraft() {
    setEditingDraft(null);
    setModalOpen(true);
  }

  function openEditDraft(draft: OfflineSpecimenDraft) {
    setEditingDraft(draft);
    setModalOpen(true);
  }

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5" aria-labelledby="offline-records-heading">
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="offline-records-heading" className="font-semibold text-zinc-900">
              Offline specimen workspace
            </h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                online ? "bg-forest-100 text-forest-800" : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {online ? "Online" : "Offline"}
            </span>
          </div>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            {cachedSpecimens.length} read-only specimen record(s) cached on this device ·{" "}
            {drafts.filter((draft) => draft.syncState !== "SYNCHRONIZED").length} local draft(s)
          </p>
        </div>

        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void synchronizeAll()}
            disabled={!online || isSynchronizing}
            className="rounded-lg border border-forest-700 px-3.5 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSynchronizing ? "Synchronizing…" : "Sync now"}
          </button>
          <button
            type="button"
            onClick={openNewDraft}
            className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-forest-800"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            New offline draft
          </button>
        </div>
      </div>

      {notice && (
        <p role="status" className="mt-3 rounded-lg bg-sage-50 px-3 py-2 text-xs text-forest-800">
          {notice}
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Local draft queue
          </h3>
          <div className="mt-2 space-y-2">
            {drafts.length === 0 && (
              <p className="rounded-lg border border-dashed border-black/15 px-3 py-5 text-center text-xs text-zinc-500">
                No offline drafts on this device.
              </p>
            )}
            {drafts.map((draft) => {
              const canEdit =
                draft.syncState !== "SYNCHRONIZING" &&
                draft.syncState !== "SYNCHRONIZED" &&
                draft.failureKind !== "CONFLICT";
              const canRetry =
                online &&
                !isSynchronizing &&
                (draft.syncState === "PENDING_SYNC" ||
                  (draft.syncState === "SYNC_FAILED" && draft.retryable));

              return (
                <article key={draft.clientDraftId} className="rounded-lg border border-black/10 p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {displayName(draft)}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {draft.draft.specimenCategory ?? "Category not recorded"}
                      </p>
                    </div>
                    <span className={`ml-auto shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${STATE_STYLES[draft.syncState]}`}>
                      {STATE_LABELS[draft.syncState]}
                    </span>
                  </div>

                  {draft.lastError && (
                    <p role="alert" className="mt-2 rounded-md bg-red-50 px-2.5 py-2 text-xs leading-5 text-red-700">
                      {draft.lastError}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => openEditDraft(draft)}
                        className="text-xs font-semibold text-forest-800 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    {(draft.syncState === "PENDING_SYNC" || draft.syncState === "SYNC_FAILED") && (
                      <button
                        type="button"
                        onClick={() => void retryDraft(draft.clientDraftId)}
                        disabled={!canRetry}
                        className="text-xs font-semibold text-forest-800 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline"
                      >
                        Retry
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDiscard(draft)}
                      disabled={draft.syncState === "SYNCHRONIZING"}
                      className="text-xs font-semibold text-red-700 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline"
                    >
                      Remove locally
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Cached server records (read-only)
            </h3>
            <div className="relative ml-auto w-full sm:w-48">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search cache"
                className="w-full rounded-lg border border-black/15 py-1.5 pl-8 pr-2 text-xs outline-none focus:border-forest-700"
              />
            </div>
            <select
              aria-label="Filter cached specimens by status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as CachedSpecimenStatusFilter)
              }
              className="rounded-lg border border-black/15 bg-white px-2 py-1.5 text-xs outline-none focus:border-forest-700"
            >
              <option value="ALL">All statuses</option>
              <option value="UNCATALOGED">Uncataloged</option>
              <option value="CATALOGED">Cataloged</option>
            </select>
            <select
              aria-label="Filter cached specimens by category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="max-w-44 rounded-lg border border-black/15 bg-white px-2 py-1.5 text-xs outline-none focus:border-forest-700"
            >
              <option value="">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category.toLowerCase()} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-forest-800 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-500" aria-live="polite">
            Showing {visibleCache.length} of {cachedSpecimens.length} cached records
          </p>
          <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-black/10">
            {visibleCache.length === 0 ? (
              <p className="px-3 py-5 text-center text-xs text-zinc-500">
                {cachedSpecimens.length === 0
                  ? "Connect and select Sync now to cache active specimen records."
                  : "No cached specimens match the current search and filters."}
              </p>
            ) : (
              <ul className="divide-y divide-black/5">
                {visibleCache.map((specimen) => (
                  <li key={specimen.id} className="px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {specimen.accessionNumber ?? specimen.scientificName ?? specimen.commonName ?? "Unnamed specimen"}
                        </p>
                        <p className="truncate text-xs text-zinc-500">
                          {[specimen.commonName, specimen.scientificName]
                            .filter(Boolean)
                            .join(" · ") || "No names recorded"}
                        </p>
                      </div>
                      <span className="ml-auto shrink-0 rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600">
                        {specimen.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <OfflineSpecimenDraftModal
          key={editingDraft?.clientDraftId ?? "new-draft"}
          draft={editingDraft}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </section>
  );
}
