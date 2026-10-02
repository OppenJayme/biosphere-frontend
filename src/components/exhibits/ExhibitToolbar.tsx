import { SearchIcon, ChevronDownIcon, PlusIcon } from "@/components/icons";
import { EXHIBIT_STATUSES, EXHIBIT_STATUS_LABELS, type ExhibitStatus } from "@/features/exhibits-qr/types";

export function ExhibitToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  onAddClick,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  status: ExhibitStatus | "";
  onStatusChange: (value: ExhibitStatus | "") => void;
  onAddClick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[220px] flex-1">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search exhibits"
          placeholder="Search by name, accession no., or URL..."
          className="w-full rounded-lg border border-black/15 py-2 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        />
      </div>
      <div className="relative">
        <select
          aria-label="Filter by publish status"
          value={status}
          onChange={(e) => onStatusChange(e.target.value as ExhibitStatus | "")}
          className="w-full appearance-none rounded-lg border border-black/15 bg-white py-2 pl-3 pr-8 text-sm text-zinc-700 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        >
          <option value="">All statuses</option>
          {EXHIBIT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {EXHIBIT_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
      </div>
      <button
        type="button"
        onClick={onAddClick}
        className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
      >
        <PlusIcon className="h-4 w-4" />
        Create Exhibit
      </button>
    </div>
  );
}
