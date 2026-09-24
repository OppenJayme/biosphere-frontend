/** Server-backed audit filters; every submitted value maps to an API query. */

import Link from "next/link";
import { CalendarIcon, SearchIcon } from "@/components/icons";
import { AUDIT_PAGE_SIZES, AUDIT_RESULTS, type AuditLogListQuery } from "@/features/audit/types";

const inputClasses =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";

export function AuditToolbar({ query }: { query: AuditLogListQuery }) {
  return (
    <form action="/audit-logs" method="get" className="space-y-3 rounded-xl border border-black/10 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="xl:col-span-2">
          <span className="mb-1 block text-xs font-medium text-zinc-600">Search audit history</span>
          <span className="relative block">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              name="search"
              type="search"
              defaultValue={query.search}
              maxLength={100}
              placeholder="Action, module, actor, record type, or UUID"
              className={`${inputClasses} pl-9`}
            />
          </span>
        </label>

        <label>
          <span className="mb-1 block text-xs font-medium text-zinc-600">Result</span>
          <select name="result" defaultValue={query.result} className={inputClasses}>
            <option value="">All results</option>
            {AUDIT_RESULTS.map((result) => (
              <option key={result} value={result}>
                {result}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-medium text-zinc-600">Rows per page</span>
          <select name="limit" defaultValue={query.limit} className={inputClasses}>
            {AUDIT_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} rows
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-medium text-zinc-600">Module</span>
          <input
            name="module"
            defaultValue={query.module}
            maxLength={100}
            placeholder="Example: specimens"
            className={inputClasses}
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-medium text-zinc-600">Action</span>
          <input
            name="action"
            defaultValue={query.action}
            maxLength={100}
            placeholder="Example: UPDATE_SPECIMEN"
            className={inputClasses}
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-medium text-zinc-600">Record type</span>
          <input
            name="affectedRecordType"
            defaultValue={query.affectedRecordType}
            maxLength={100}
            placeholder="Example: specimen"
            className={inputClasses}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-600">
              <CalendarIcon className="h-3.5 w-3.5" /> From
            </span>
            <input name="fromDate" type="date" defaultValue={query.fromDate} className={inputClasses} />
          </label>
          <label>
            <span className="mb-1 flex items-center gap-1 text-xs font-medium text-zinc-600">
              <CalendarIcon className="h-3.5 w-3.5" /> To
            </span>
            <input name="toDate" type="date" defaultValue={query.toDate} className={inputClasses} />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Link
          href="/audit-logs"
          className="rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
        >
          Clear filters
        </Link>
        <button
          type="submit"
          className="rounded-lg bg-forest-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-800"
        >
          Apply filters
        </button>
      </div>
    </form>
  );
}
