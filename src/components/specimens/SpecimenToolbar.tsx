import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { SPECIMEN_STATUSES, type SpecimenListQuery } from "@/features/specimens/types";

function statusLabel(status: (typeof SPECIMEN_STATUSES)[number]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function SpecimenToolbar({ query }: { query: SpecimenListQuery }) {
  const hasFilters = query.search.length > 0 || query.status !== null;

  return (
    <div className="flex flex-wrap items-end gap-2.5">
      <form action="/specimens" className="flex min-w-0 flex-1 flex-wrap items-end gap-2.5">
      <label className="relative min-w-56 flex-1">
        <span className="sr-only">Search specimen records</span>
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          name="search"
          defaultValue={query.search}
          maxLength={100}
          placeholder="Search specimens..."
          className="w-full rounded-lg border border-black/15 py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        />
      </label>

      <label className="text-xs font-medium text-zinc-600">
        <span className="sr-only">Catalog status</span>
        <select
          name="status"
          defaultValue={query.status ?? ""}
          className="rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-zinc-800 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        >
          <option value="">All statuses</option>
          {SPECIMEN_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
      >
        Apply
      </button>

      {hasFilters && (
        <Link
          href="/specimens"
          className="rounded-lg px-3 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50"
        >
          Clear
        </Link>
      )}
      </form>

      <Link
        href="/specimens/new"
        className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
      >
        Add specimen draft
      </Link>
    </div>
  );
}
