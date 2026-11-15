import { SearchIcon, PlusIcon } from "@/components/icons";
import { FilterChips } from "@/components/ui/FilterChips";
import { EXHIBIT_STATUSES, EXHIBIT_STATUS_LABELS, type ExhibitStatus } from "@/features/exhibits-qr/types";

/** "" shows every exhibit; "with" and "without" filter on whether an AR model has been uploaded. */
export type ArFilter = "" | "with" | "without";

export function ExhibitToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  counts,
  ar,
  onArChange,
  arCounts,
  onAddClick,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: ExhibitStatus | "";
  onStatusChange: (value: ExhibitStatus | "") => void;
  /** Exhibits per status, shown on the filter chips. */
  counts: Record<ExhibitStatus, number>;
  ar: ArFilter;
  onArChange: (value: ArFilter) => void;
  /** Exhibits with and without an uploaded AR model, shown on the filter chips. */
  arCounts: { with: number; without: number };
  onAddClick: () => void;
}) {
  const total = EXHIBIT_STATUSES.reduce((sum, value) => sum + counts[value], 0);
  return (
    <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label="Filter by publish status"
          chips={[
            { label: "All", count: total, active: status === "", onClick: () => onStatusChange("") },
            ...(["PUBLISHED", "UNPUBLISHED", "DISABLED"] as const).map((value) => ({
              label: EXHIBIT_STATUS_LABELS[value],
              count: counts[value],
              active: status === value,
              onClick: () => onStatusChange(value),
            })),
          ]}
        />
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
        >
          <PlusIcon className="h-4 w-4" />
          Create exhibit
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs font-medium text-zinc-500">
          Has AR
        </span>
        <FilterChips
          label="Filter by AR model"
          chips={[
            { label: "All", count: total, active: ar === "", onClick: () => onArChange("") },
            { label: "With AR", count: arCounts.with, active: ar === "with", onClick: () => onArChange("with") },
            {
              label: "Without AR",
              count: arCounts.without,
              active: ar === "without",
              onClick: () => onArChange("without"),
            },
          ]}
        />
      </div>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search exhibits"
          placeholder="Search by name, accession no., or web address…"
          className="w-full rounded-lg border border-black/15 py-2 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        />
      </div>
    </div>
  );
}
