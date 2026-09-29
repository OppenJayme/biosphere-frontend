"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { Inquiry } from "@/features/inquiries/types";
import type { CommunicationEntry } from "@/features/public-submissions/history";
import { publicWebsiteHref, type PublicWebsiteQuery } from "@/features/public-submissions/query";
import type { CampusEntrySummary, VisitRequest } from "@/features/visit-requests/types";
import { InquiryDetail } from "./InquiryDetail";
import { PublicWebsiteToolbar } from "./PublicWebsiteToolbar";
import { SubmissionTable, type SubmissionRows } from "./SubmissionTable";
import { VisitRequestDetail } from "./VisitRequestDetail";

export type SubmissionSelection =
  | { kind: "inquiry"; record: Inquiry; history: CommunicationEntry[] | null }
  | {
      kind: "visit";
      record: VisitRequest;
      history: CommunicationEntry[] | null;
      campusEntry: CampusEntrySummary | null;
    };

const PAGE_SIZES = [10, 25, 50];

function EmptyDetail({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <p className="py-6 text-center text-xs text-zinc-500">{message}</p>
    </div>
  );
}

export function PublicWebsiteWorkspace({
  query,
  rows,
  listError,
  selection,
  selectionError,
  pendingInquiries,
  pendingVisits,
  currentAccountId,
}: {
  query: PublicWebsiteQuery;
  rows: SubmissionRows | null;
  listError?: string;
  selection: SubmissionSelection | null;
  selectionError?: string;
  pendingInquiries: number | null;
  pendingVisits: number | null;
  currentAccountId: string | null;
}) {
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const total = rows?.items.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Open on the page that holds the selected record, so a selection made elsewhere stays visible.
  const selectedIndex = rows && selection ? rows.items.findIndex((item) => item.id === selection.record.id) : -1;
  const [page, setPage] = useState(selectedIndex >= 0 ? Math.floor(selectedIndex / pageSize) + 1 : 1);
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;

  const pageRows: SubmissionRows | null = rows
    ? rows.kind === "inquiry"
      ? { kind: "inquiry", items: rows.items.slice(start, start + pageSize) }
      : { kind: "visit", items: rows.items.slice(start, start + pageSize) }
    : null;

  const returnQuery = { tab: query.tab, status: query.status, search: query.search };
  const hrefFor = (id: string) => publicWebsiteHref(query, { selected: id });
  const recordLabel = query.tab === "inquiries" ? "inquiries" : "visit requests";
  const filtered = Boolean(query.status || query.search);

  return (
    <div className="space-y-4">
      <PublicWebsiteToolbar query={query} pendingInquiries={pendingInquiries} pendingVisits={pendingVisits} />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label={`${recordLabel} list`} className="min-w-0 space-y-4 rounded-xl border border-black/10 bg-white p-5">
          {listError ? (
            <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Unable to load {recordLabel}</p>
              <p className="mt-1">{listError}</p>
              <Link
                href={publicWebsiteHref(query)}
                className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800"
              >
                Retry
              </Link>
            </div>
          ) : pageRows && total > 0 ? (
            <SubmissionTable rows={pageRows} selectedId={selection?.record.id ?? null} hrefFor={hrefFor} />
          ) : (
            <p className="py-10 text-center text-sm text-zinc-500">
              {filtered
                ? `No ${recordLabel} match these filters.`
                : `No ${recordLabel} yet. New submissions from the public website appear here.`}
            </p>
          )}

          {!listError && total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-xs text-zinc-500">
              <p aria-live="polite">
                Showing {start + 1} to {Math.min(start + pageSize, total)} of {total} {recordLabel}
              </p>
              <nav aria-label="Pagination" className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-sage-100 disabled:text-zinc-300 disabled:hover:bg-transparent"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 tabular-nums">
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                  aria-label="Next page"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 hover:bg-sage-100 disabled:text-zinc-300 disabled:hover:bg-transparent"
                >
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </button>
              </nav>
              <div className="relative">
                <label htmlFor="submission-page-size" className="sr-only">
                  Rows per page
                </label>
                <select
                  id="submission-page-size"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
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
          )}
        </section>

        <aside aria-label="Selected record">
          {selectionError ? (
            <EmptyDetail message={selectionError} />
          ) : selection?.kind === "inquiry" ? (
            <InquiryDetail
              inquiry={selection.record}
              history={selection.history}
              returnQuery={returnQuery}
              currentAccountId={currentAccountId}
            />
          ) : selection?.kind === "visit" ? (
            <VisitRequestDetail
              request={selection.record}
              history={selection.history}
              campusEntry={selection.campusEntry}
              returnQuery={returnQuery}
              currentAccountId={currentAccountId}
            />
          ) : (
            <EmptyDetail message={`Select one of the ${recordLabel} to see its details here.`} />
          )}
        </aside>
      </div>
    </div>
  );
}
