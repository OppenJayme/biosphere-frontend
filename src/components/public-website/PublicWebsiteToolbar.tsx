import Link from "next/link";
import type { ReactNode } from "react";
import { SearchIcon, ChevronDownIcon, CalendarIcon, ChatIcon } from "@/components/icons";
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
  type WebsiteTab,
} from "@/features/public-submissions/query";
import { VISIT_REQUEST_STATUSES } from "@/features/visit-requests/types";
import { VISIT_REQUEST_STATUS_LABELS } from "@/features/visit-requests/workflow";

const inputClasses =
  "w-full rounded-lg border border-black/15 bg-white py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";

function TabLink({
  tab,
  active,
  pendingCount,
  children,
}: {
  tab: WebsiteTab;
  active: boolean;
  pendingCount: number | null;
  children: ReactNode;
}) {
  return (
    <Link
      href={publicWebsiteHref({ tab })}
      aria-current={active ? "page" : undefined}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 ${
        active ? "bg-forest-700 text-white" : "border border-black/15 text-zinc-700 hover:bg-sage-100"
      }`}
    >
      {children}
      {pendingCount !== null && pendingCount > 0 && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            active ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
          }`}
        >
          {pendingCount} pending
        </span>
      )}
    </Link>
  );
}

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
        className={`${inputClasses} w-auto px-2.5 text-zinc-700`}
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
        className={`${inputClasses} w-auto px-2.5 text-zinc-700`}
      />
    </fieldset>
  );
}

export function PublicWebsiteToolbar({
  query,
  pendingInquiries,
  pendingVisits,
}: {
  query: PublicWebsiteQuery;
  pendingInquiries: number | null;
  pendingVisits: number | null;
}) {
  const statuses =
    query.tab === "inquiries"
      ? INQUIRY_STATUSES.map((status) => ({ value: status, label: INQUIRY_STATUS_LABELS[status] }))
      : VISIT_REQUEST_STATUSES.map((status) => ({ value: status, label: VISIT_REQUEST_STATUS_LABELS[status] }));
  const filtered = hasListFilters(query);

  return (
    <div className="space-y-3">
      <nav aria-label="Submission type" className="flex flex-wrap gap-2">
        <TabLink tab="inquiries" active={query.tab === "inquiries"} pendingCount={pendingInquiries}>
          <ChatIcon className="h-4 w-4" />
          General Inquiries
        </TabLink>
        <TabLink tab="visits" active={query.tab === "visits"} pendingCount={pendingVisits}>
          <CalendarIcon className="h-4 w-4" />
          Visit Requests
        </TabLink>
      </nav>

      {/* A plain GET form: filters live in the URL, so they survive reloads and back/forward. */}
      <form
        action={PUBLIC_WEBSITE_PATH}
        role="search"
        className="flex flex-col gap-2.5"
        key={listFilterKey(query)}
      >
        {query.tab === "visits" && <input type="hidden" name="tab" value="visits" />}
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
          <div className="relative md:flex-1">
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
                  ? "Search name, email, organization, topic, message, or reference"
                  : "Search contact, email, organization, purpose, or reference"
              }
              className={`${inputClasses} pl-10 pr-3`}
            />
          </div>
          <div className="relative md:w-60">
            <label htmlFor="submission-status" className="sr-only">
              Status
            </label>
            <select
              id="submission-status"
              name="status"
              defaultValue={query.status}
              className={`${inputClasses} appearance-none pl-3 pr-8 text-zinc-700`}
            >
              <option value="">All statuses</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>
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
          <div className="flex gap-2 md:ml-auto">
            <button
              type="submit"
              className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2"
            >
              Apply
            </button>
            {filtered && (
              <Link
                href={publicWebsiteHref({ tab: query.tab })}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
              >
                Clear
              </Link>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
