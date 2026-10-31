"use client";

import Link from "next/link";
import { useState } from "react";
import { FilterChips } from "@/components/ui/FilterChips";
import { FILTER_TOGGLE_CLASSES, FilterToggleContent } from "@/components/ui/FilterToggle";
import { SearchIcon } from "@/components/icons";
import { INQUIRY_STATUSES } from "@/features/inquiries/types";
import { INQUIRY_STATUS_LABELS } from "@/features/inquiries/workflow";
import {
  PUBLIC_WEBSITE_PATH,
  SEARCH_MAX,
  hasListFilters,
  listFilterKey,
  publicWebsiteHref,
  type DateFilters,
  type PublicWebsiteQuery,
} from "@/features/public-submissions/query";
import { VISIT_REQUEST_STATUSES } from "@/features/visit-requests/types";
import { VISIT_REQUEST_STATUS_LABELS } from "@/features/visit-requests/workflow";

const inputBase =
  "rounded-lg border border-black/15 bg-white py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";
const inputClasses = `w-full ${inputBase}`;

/** A labelled From/To pair of native date inputs; the browser submits them as YYYY-MM-DD. */
function DateRange({
  legend,
  fromName,
  toName,
  query,
  hint,
}: {
  legend: string;
  fromName: keyof DateFilters;
  toName: keyof DateFilters;
  query: PublicWebsiteQuery;
  hint: string;
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{legend}</legend>
      <span aria-hidden="true" className="text-xs font-semibold text-zinc-600">
        {legend}
      </span>
      <label className="sr-only" htmlFor={`submission-${fromName}`}>
        {legend} from
      </label>
      <input
        id={`submission-${fromName}`}
        type="date"
        name={fromName}
        defaultValue={query[fromName]}
        title={hint}
        className={`${inputBase} w-40 px-2.5 text-zinc-700`}
      />
      <span aria-hidden="true" className="text-xs text-zinc-500">
        to
      </span>
      <label className="sr-only" htmlFor={`submission-${toName}`}>
        {legend} to
      </label>
      <input
        id={`submission-${toName}`}
        type="date"
        name={toName}
        defaultValue={query[toName]}
        title={hint}
        className={`${inputBase} w-40 px-2.5 text-zinc-700`}
      />
    </fieldset>
  );
}

/**
 * The Search and Clear buttons share this row, so the panel is ordered onto its own line
 * below them. Its fields come first in the page order, so Tab still reaches them before Search.
 * Closed fields stay in the form, so an applied date keeps filtering.
 */
function DateFilters({ query }: { query: PublicWebsiteQuery }) {
  const inUse = Boolean(
    query.submittedFrom || query.submittedTo || query.visitDateFrom || query.visitDateTo,
  );
  const [open, setOpen] = useState(inUse);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls="submission-date-filters"
        className={`${FILTER_TOGGLE_CLASSES} order-2 shrink-0 justify-center`}
      >
        <FilterToggleContent open={open}>Date filters</FilterToggleContent>
      </button>
      <div
        id="submission-date-filters"
        hidden={!open}
        className="order-last basis-full rounded-lg border border-black/10 bg-sage-50 p-3"
      >
        <div className="flex flex-col gap-2.5 md:flex-row md:flex-wrap md:items-center md:gap-x-5">
          <DateRange
            legend="Submitted"
            fromName="submittedFrom"
            toName="submittedTo"
            query={query}
            hint="Date the visitor submitted it (museum time)"
          />
          {query.tab === "visits" && (
            <DateRange
              legend="Visit date"
              fromName="visitDateFrom"
              toName="visitDateTo"
              query={query}
              hint="Approved visit date, or any preferred date while none is approved"
            />
          )}
        </div>
      </div>
    </>
  );
}

export function PublicWebsiteToolbar({
  query,
  statusCounts,
}: {
  query: PublicWebsiteQuery;
  /** Records per status for the current section, before filters; null when the list failed to load. */
  statusCounts: Record<string, number> | null;
}) {
  const statuses =
    query.tab === "inquiries"
      ? INQUIRY_STATUSES.map((status) => ({ value: status, label: INQUIRY_STATUS_LABELS[status] }))
      : VISIT_REQUEST_STATUSES.map((status) => ({ value: status, label: VISIT_REQUEST_STATUS_LABELS[status] }));
  const filtered = hasListFilters(query);

  return (
    <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
      <FilterChips
        label="Filter by status"
        chips={[
          {
            label: "All",
            count: statusCounts ? Object.values(statusCounts).reduce((sum, count) => sum + count, 0) : null,
            active: !query.status,
            href: publicWebsiteHref({ ...query, status: "" }),
          },
          ...statuses.map((status) => ({
            label: status.label,
            count: statusCounts ? (statusCounts[status.value] ?? 0) : null,
            active: query.status === status.value,
            href: publicWebsiteHref({ ...query, status: status.value }),
          })),
        ]}
      />

      {/* A plain GET form: filters live in the URL, so they survive reloads and back/forward. */}
      <form
        action={PUBLIC_WEBSITE_PATH}
        role="search"
        className="flex flex-wrap items-center gap-2.5"
        key={listFilterKey(query)}
      >
        {query.tab === "visits" && <input type="hidden" name="tab" value="visits" />}
        {query.status && <input type="hidden" name="status" value={query.status} />}
        <div className="relative order-1 min-w-64 flex-1">
          <label htmlFor="submission-search" className="sr-only">
              Search {query.tab === "inquiries" ? "inquiries" : "visit requests"}
            </label>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="submission-search"
            type="search"
            name="search"
            defaultValue={query.search}
            maxLength={SEARCH_MAX}
            placeholder={
              query.tab === "inquiries"
                ? "Search name, email, organization, topic, message, or reference no.…"
                : "Search contact, email, organization, purpose, or reference no.…"
            }
            className={`${inputClasses} h-10 pl-10 pr-3`}
          />
        </div>
        <DateFilters query={query} />
        <div className="order-3 flex gap-2">
          <button
            type="submit"
            className="h-10 rounded-lg bg-forest-700 px-4 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2"
          >
            Search
          </button>
          {filtered && (
            <Link
              href={publicWebsiteHref({ tab: query.tab })}
              className="inline-flex h-10 items-center rounded-lg border border-black/15 px-4 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
            >
              Clear
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
