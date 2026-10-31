/** Server-backed audit filters; every submitted value maps to an API query. */

import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import { FilterChips } from "@/components/ui/FilterChips";
import { FILTER_TOGGLE_CLASSES, FilterToggleContent } from "@/components/ui/FilterToggle";
import { InfoTip } from "@/components/ui/InfoTip";
import { auditLogListHref } from "@/features/audit/query";
import { DEFAULT_AUDIT_PAGE_SIZE, type AuditLogListQuery } from "@/features/audit/types";

const inputClasses =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";
const labelClasses = "mb-1 flex items-center gap-1 text-xs font-medium text-zinc-600";

const RESULT_CHIPS = [
  { label: "All", value: "" },
  { label: "Successful", value: "SUCCESS" },
  { label: "Failed", value: "FAILED" },
  { label: "Denied", value: "DENIED" },
] as const;

export function AuditToolbar({ query }: { query: AuditLogListQuery }) {
  // The code-level filters stay available but folded away, opened automatically when in use.
  const advancedInUse = Boolean(query.module || query.action || query.affectedRecordType);
  const anyFilter = Boolean(query.search || query.result || query.fromDate || query.toDate || advancedInUse);

  return (
    <div className="space-y-3 rounded-xl border border-black/10 bg-white p-5">
      <FilterChips
        label="Filter by result"
        chips={RESULT_CHIPS.map((chip) => ({
          label: chip.label,
          active: query.result === chip.value,
          href: auditLogListHref({ ...query, result: chip.value }, 1),
        }))}
      />

      <form action="/audit-logs" method="get" className="space-y-3">
        {query.result && <input type="hidden" name="result" value={query.result} />}
        {query.limit !== DEFAULT_AUDIT_PAGE_SIZE && <input type="hidden" name="limit" value={query.limit} />}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label>
            <span className={labelClasses}>Search</span>
            <span className="relative block">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                name="search"
                type="search"
                defaultValue={query.search}
                maxLength={100}
                placeholder="Person's name, action, or module…"
                className={`${inputClasses} pl-9`}
              />
            </span>
          </label>
          <label>
            <span className={labelClasses}>From</span>
            <input name="fromDate" type="date" defaultValue={query.fromDate} className={inputClasses} />
          </label>
          <label>
            <span className={labelClasses}>To</span>
            <input name="toDate" type="date" defaultValue={query.toDate} className={inputClasses} />
          </label>
        </div>

        <details open={advancedInUse} className="group">
          <summary className={FILTER_TOGGLE_CLASSES}>
            <FilterToggleContent>More filters</FilterToggleContent>
          </summary>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label>
              <span className={labelClasses}>
                Module
                <InfoTip label="Module filter">
                  The part of BioSphere where it happened, for example specimens, exhibits or auth (sign-in).
                </InfoTip>
              </span>
              <input name="module" defaultValue={query.module} maxLength={100} placeholder="e.g. specimens" className={inputClasses} />
            </label>
            <label>
              <span className={labelClasses}>
                Action code
                <InfoTip label="Action code filter">
                  The exact action name the system stored, for example UPDATE_SPECIMEN or LOGIN.
                </InfoTip>
              </span>
              <input name="action" defaultValue={query.action} maxLength={100} placeholder="e.g. UPDATE_SPECIMEN" className={inputClasses} />
            </label>
            <label>
              <span className={labelClasses}>Record type</span>
              <input
                name="affectedRecordType"
                defaultValue={query.affectedRecordType}
                maxLength={100}
                placeholder="e.g. specimen"
                className={inputClasses}
              />
            </label>
          </div>
        </details>

        <div className="flex flex-wrap justify-end gap-2">
          {anyFilter && (
            <Link
              href="/audit-logs"
              className="rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
            >
              Clear filters
            </Link>
          )}
          <button
            type="submit"
            className="rounded-lg bg-forest-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
