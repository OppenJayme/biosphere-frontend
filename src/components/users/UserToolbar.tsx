import { SearchIcon, ChevronDownIcon, FilterIcon, DownloadIcon, PlusIcon } from "@/components/icons";
import type { USER_FILTERS } from "@/lib/dummy-data/users";

function FilterSelect({ options }: { options: readonly string[] }) {
  return (
    <div className="relative">
      <select
        defaultValue={options[0]}
        className="w-full appearance-none rounded-lg border border-black/15 bg-white py-2 pl-3 pr-8 text-sm text-zinc-700 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
    </div>
  );
}

export function UserToolbar({
  filters,
  onAddClick,
}: {
  filters: typeof USER_FILTERS;
  onAddClick: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[200px] flex-1">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          placeholder="Search users..."
          className="w-full rounded-lg border border-black/15 py-2 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        />
      </div>
      <FilterSelect options={filters.role} />
      <FilterSelect options={filters.status} />
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
      >
        <FilterIcon className="h-4 w-4" />
        Filters
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
      >
        <DownloadIcon className="h-4 w-4" />
        Export
      </button>
      <button
        type="button"
        onClick={onAddClick}
        className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
      >
        <PlusIcon className="h-4 w-4" />
        Add Curator
      </button>
    </div>
  );
}
