import Link from "next/link";
import {
  revisionFieldLabel,
  specimenRevisionHistoryHref,
  type SpecimenRevisionQuery,
} from "@/features/specimens/revision-history";
import type { SpecimenRevisionPage } from "@/features/specimens/types";

type SpecimenRevisionHistoryProps = {
  specimenId: string;
  history: SpecimenRevisionPage;
  query: SpecimenRevisionQuery;
};

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

function displayValue(value: string | null) {
  // Keep null visibly different from an empty table cell without inventing catalog data.
  return value === null || value.length === 0 ? "Not recorded" : value;
}

export function SpecimenRevisionHistory({
  specimenId,
  history,
  query,
}: SpecimenRevisionHistoryProps) {
  const { items, limit, page, total } = history;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const firstRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastRecord = Math.min(page * limit, total);
  const hasFilters = Boolean(query.fieldChanged || query.sourceSection);

  return (
    <div className="space-y-4">
      <form
        action={`/specimens/${specimenId}/history`}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-black/10 bg-white p-4"
      >
        <label className="min-w-56 flex-1 text-xs font-medium text-zinc-700">
          Field changed
          <input
            type="search"
            name="fieldChanged"
            defaultValue={query.fieldChanged}
            maxLength={100}
            placeholder="Example: scientific_name"
            className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
        </label>
        <label className="min-w-56 flex-1 text-xs font-medium text-zinc-700">
          Source section
          <input
            type="search"
            name="sourceSection"
            defaultValue={query.sourceSection}
            maxLength={100}
            placeholder="Example: specimen_core"
            className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
        >
          Apply filters
        </button>
        {hasFilters && (
          <Link
            href={`/specimens/${specimenId}/history`}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50"
          >
            Clear
          </Link>
        )}
      </form>

      <section className="rounded-xl border border-black/10 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-600">
            {total === 0
              ? "No recorded changes match these filters."
              : `Showing ${firstRecord}–${lastRecord} of ${total} recorded changes`}
          </p>
          {totalPages > 1 && (
            <nav aria-label="Revision history pages" className="flex items-center gap-1.5 text-sm">
              {page > 1 ? (
                <Link
                  href={specimenRevisionHistoryHref(specimenId, query, page - 1)}
                  className="rounded-md border border-black/15 px-3 py-1.5 font-medium text-zinc-700 hover:bg-sage-100"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-md border border-black/10 px-3 py-1.5 text-zinc-400">
                  Previous
                </span>
              )}
              <span className="px-1 text-xs text-zinc-500">
                Page {page} of {totalPages}
              </span>
              {page < totalPages ? (
                <Link
                  href={specimenRevisionHistoryHref(specimenId, query, page + 1)}
                  className="rounded-md border border-black/15 px-3 py-1.5 font-medium text-zinc-700 hover:bg-sage-100"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-md border border-black/10 px-3 py-1.5 text-zinc-400">
                  Next
                </span>
              )}
            </nav>
          )}
        </div>

        {items.length > 0 && (
          <ol className="space-y-3">
            {items.map((revision) => (
              <li key={revision.id} className="rounded-lg border border-black/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-900">
                      {revisionFieldLabel(revision.fieldChanged)}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {revisionFieldLabel(revision.sourceSection)} · Changed by{" "}
                      <span className="font-medium text-zinc-700">
                        {revision.changedBy.fullName}
                      </span>{" "}
                      ({revision.changedBy.role.toLowerCase()})
                    </p>
                  </div>
                  <time
                    dateTime={revision.changedAt}
                    className="text-xs font-medium text-zinc-500"
                  >
                    {dateFormatter.format(new Date(revision.changedAt))}
                  </time>
                </div>

                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-zinc-50 p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      Previous value
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-700">
                      {displayValue(revision.oldValue)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-sage-50 p-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                      New value
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-800">
                      {displayValue(revision.newValue)}
                    </dd>
                  </div>
                </dl>

                {revision.reason && (
                  <p className="mt-3 break-words text-sm text-zinc-600">
                    <span className="font-medium text-zinc-700">Reason:</span>{" "}
                    {revision.reason}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
