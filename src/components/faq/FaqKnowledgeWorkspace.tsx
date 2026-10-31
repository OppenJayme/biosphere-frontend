/** Read-only curator workspace for approved FAQ knowledge records. */

"use client";

import Link from "next/link";
import { useState } from "react";
import { ChatIcon, ClockIcon } from "@/components/icons";
import { FaqKnowledgeManagement } from "./FaqKnowledgeManagement";
import { faqKnowledgeHref } from "@/features/faq/query";
import {
  FAQ_STATUSES,
  type FaqEntry,
  type FaqEntryPage,
  type FaqListQuery,
  type FaqStatus,
} from "@/features/faq/types";
import { PrevNextPagination } from "@/components/ui/PrevNextPagination";

type FaqKnowledgeWorkspaceProps = {
  page: FaqEntryPage | null;
  query: FaqListQuery;
  errorMessage?: string;
  initialSelectedId?: string;
};

const inputClasses =
  "rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";
const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

export function FaqKnowledgeWorkspace({
  page,
  query,
  errorMessage,
  initialSelectedId,
}: FaqKnowledgeWorkspaceProps) {
  const [selectedId, setSelectedId] = useState(
    initialSelectedId && page?.items.some((entry) => entry.id === initialSelectedId)
      ? initialSelectedId
      : page?.items[0]?.id ?? null,
  );
  const selected = page?.items.find((entry) => entry.id === selectedId) ?? page?.items[0] ?? null;

  if (errorMessage || !page) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        <p className="font-semibold">Unable to load FAQ knowledge</p>
        <p className="mt-1">{errorMessage ?? "No placeholder knowledge is shown."}</p>
        <Link
          href="/faq-knowledge"
          className="mt-3 inline-flex rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800"
        >
          Retry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-black/10 bg-white p-5">
        <form action="/faq-knowledge" className="flex flex-col gap-3 md:flex-row md:items-end">
          <label className="min-w-0 flex-[2] text-xs font-medium text-zinc-700">
            Search
            <input
              type="search"
              name="search"
              defaultValue={query.search}
              maxLength={200}
              placeholder="Question, answer, category, or keyword"
              className={`${inputClasses} mt-1 w-full`}
            />
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Status
            <select name="status" defaultValue={query.status} className={`${inputClasses} mt-1 block min-w-44`}>
              <option value="">All statuses</option>
              {FAQ_STATUSES.map((status) => (
                <option key={status} value={status}>{humanize(status)}</option>
              ))}
            </select>
          </label>
          <label className="min-w-0 flex-1 text-xs font-medium text-zinc-700">
            Exact category
            <input
              name="category"
              defaultValue={query.category}
              maxLength={100}
              placeholder="Example: Visit"
              className={`${inputClasses} mt-1 w-full`}
            />
          </label>
          <button type="submit" className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800">
            Apply filters
          </button>
          {(query.status || query.category || query.search) && (
            <Link href="/faq-knowledge" className="rounded-lg px-3 py-2 text-center text-sm font-semibold text-forest-800 hover:bg-forest-50">
              Clear
            </Link>
          )}
        </form>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 rounded-xl border border-black/10 bg-white p-5">
          {page.items.length === 0 ? (
            <div className="py-12 text-center">
              <ChatIcon className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-3 text-sm font-semibold text-zinc-900">No FAQ knowledge matches these filters</p>
              <p className="mt-1 text-sm text-zinc-500">No sample answers are substituted.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-xs text-zinc-500">
                    <th scope="col" className="py-2 pr-3 font-medium">Question</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Category</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Status</th>
                    <th scope="col" className="py-2 pr-0 font-medium">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {page.items.map((entry) => (
                    <tr key={entry.id} className={entry.id === selected?.id ? "bg-forest-50" : "hover:bg-sage-50"}>
                      <td className="p-0">
                        <button
                          type="button"
                          onClick={() => setSelectedId(entry.id)}
                          aria-pressed={entry.id === selected?.id}
                          className="w-full py-2.5 pr-3 text-left font-medium text-zinc-900 focus-visible:outline-2 focus-visible:outline-forest-700"
                        >
                          {entry.question}
                        </button>
                      </td>
                      <td className="py-2.5 pr-3 text-zinc-600">{entry.category ?? "Uncategorized"}</td>
                      <td className="py-2.5 pr-3"><StatusBadge status={entry.status} /></td>
                      <td className="py-2.5 pr-0 whitespace-nowrap text-zinc-500">{formatDate(entry.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Pagination page={page} query={query} />
        </section>

        <FaqDetail entry={selected} />
      </div>

      <FaqKnowledgeManagement selected={selected} />

    </div>
  );
}

function FaqDetail({ entry }: { entry: FaqEntry | null }) {
  if (!entry) {
    return (
      <aside className="h-fit rounded-xl border border-black/10 bg-white p-5 text-sm text-zinc-500">
        Select an FAQ entry to review its approved content.
      </aside>
    );
  }

  return (
    <aside className="h-fit rounded-xl border border-black/10 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">Knowledge details</h2>
        <StatusBadge status={entry.status} />
      </div>
      <dl className="mt-4 space-y-4">
        <Detail label="Question"><p className="whitespace-pre-wrap">{entry.question}</p></Detail>
        <Detail label="Approved answer"><p className="whitespace-pre-wrap">{entry.answer}</p></Detail>
        <Detail label="Category"><p>{entry.category ?? "Uncategorized"}</p></Detail>
        <TermList label="Alternative wording" values={entry.alternativeWording} />
        <TermList label="Keywords" values={entry.keywords} />
        <Detail label="Last updated"><p>{formatDate(entry.updatedAt)}</p></Detail>
      </dl>
      <Link
        href={`/audit-logs?search=${encodeURIComponent(entry.id)}&affectedRecordType=faq_entry`}
        className="mt-5 flex items-center justify-center gap-2 rounded-lg border border-forest-700 px-3 py-2 text-sm font-semibold text-forest-800 hover:bg-forest-50"
      >
        <ClockIcon className="h-4 w-4" />
        View audit history
      </Link>
    </aside>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm text-zinc-800">{children}</dd>
    </div>
  );
}

function TermList({ label, values }: { label: string; values: string[] }) {
  return (
    <Detail label={label}>
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {values.map((value) => <li key={value} className="rounded-full bg-sage-100 px-2 py-1 text-xs text-forest-800">{value}</li>)}
        </ul>
      ) : <p className="text-zinc-500">None recorded</p>}
    </Detail>
  );
}

function StatusBadge({ status }: { status: FaqStatus }) {
  const styles: Record<FaqStatus, string> = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    INACTIVE: "bg-amber-50 text-amber-800",
    ARCHIVED: "bg-zinc-100 text-zinc-600",
  };
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[status]}`}>{humanize(status)}</span>;
}

function Pagination({ page, query }: { page: FaqEntryPage; query: FaqListQuery }) {
  const first = page.total === 0 ? 0 : (page.page - 1) * page.limit + 1;
  const last = Math.min(page.page * page.limit, page.total);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-4 text-sm text-zinc-600">
      <p>{page.total === 0 ? "No entries" : `Showing ${first}-${last} of ${page.total} entries`}</p>
      <PrevNextPagination
        label="FAQ knowledge pages"
        page={page.page}
        totalPages={Math.max(1, Math.ceil(page.total / page.limit))}
        hrefFor={(target) => faqKnowledgeHref(query, target)}
      />
    </div>
  );
}

function humanize(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : dateFormatter.format(date);
}
