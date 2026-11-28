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

const RECORD_TYPE_NAMES: Record<string, string> = {
  storage_unit: "storage location",
  specimen: "specimen",
  exhibit: "exhibit",
  collection: "collection",
  inquiry: "inquiry",
  visit_request: "visit request",
  user_account: "account",
};

export function AuditToolbar({
  query,
  recordFilterLabel = null,
}: {
  query: AuditLogListQuery;
  /** Name of the one record being shown, from the page; never its id. */
  recordFilterLabel?: string | null;
}) {
  const recordTypeName = RECORD_TYPE_NAMES[query.affectedRecordType.toLowerCase()] ?? "record";
  // A one-record filter keeps its record type: clearing the type would leave an unnamed record.
  const recordTypeLocked = Boolean(query.affectedRecordId && query.affectedRecordType);
  // The code-level filters stay available but folded away, opened automatically when in use.
  const advancedInUse = Boolean(query.module || query.action || query.affectedRecordType);
  const anyFilter = Boolean(
    query.search || query.result || query.fromDate || query.toDate || query.affectedRecordId || advancedInUse,
  );

  return (
    <div className="space-y-3 rounded-xl border border-black/10 bg-white p-5">
      {query.affectedRecordId && (
        <p className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-forest-50 px-3 py-2 text-sm text-forest-900">
          <span>
            {recordFilterLabel ? (
              <>
                Showing the history of <span className="font-semibold">{recordFilterLabel}</span> ({recordTypeName}). Search
                and dates narrow it further.
              </>
            ) : (
              <>Showing the history of one {recordTypeName}. Search and dates narrow it further.</>
            )}
          </span>
          <Link
            href={auditLogListHref({ ...query, affectedRecordId: "", affectedRecordType: "" }, 1)}
            className="font-semibold text-forest-800 underline-offset-2 hover:underline"
          >
            Show all history
          </Link>
        </p>
      )}
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
        {query.affectedRecordId && <input type="hidden" name="affectedRecordId" value={query.affectedRecordId} />}
        {recordTypeLocked && <input type="hidden" name="affectedRecordType" value={query.affectedRecordType} />}
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
                name={recordTypeLocked ? undefined : "affectedRecordType"}
                defaultValue={query.affectedRecordType}
                disabled={recordTypeLocked}
                title={recordTypeLocked ? "Set by the one-record filter. Use Show all history to change it." : undefined}
                maxLength={100}
                placeholder="e.g. specimen"
                className={`${inputClasses} disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500`}
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
