import {
  SearchIcon,
  ChevronDownIcon,
  PlusIcon,
  DownloadIcon,
  QrCodeIcon,
  ListIcon,
  GridIcon,
} from "@/components/icons";
import type { SPECIMEN_FILTERS } from "@/lib/dummy-data/specimens";

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

export function SpecimenToolbar({
  filters,
  onAddClick,
}: {
  filters: typeof SPECIMEN_FILTERS;
  onAddClick: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search specimens..."
            className="w-full rounded-lg border border-black/15 py-2 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
        </div>
        <FilterSelect options={filters.collectionType} />
        <FilterSelect options={filters.status} />
        <FilterSelect options={filters.condition} />
        <FilterSelect options={filters.storageLocation} />
        <FilterSelect options={filters.dateAdded} />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
        >
          <PlusIcon className="h-4 w-4" />
          Add New Specimen
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-sage-100"
        >
          <DownloadIcon className="h-4 w-4" />
          Import Record/s
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-sage-100"
        >
          <QrCodeIcon className="h-4 w-4" />
          Scan QR
        </button>

        <div className="ml-auto flex items-center gap-2.5">
          <div className="flex items-center gap-1 rounded-lg border border-black/15 p-1 text-sm">
            <span className="flex items-center gap-1.5 rounded-md bg-forest-700 px-2.5 py-1.5 font-medium text-white">
              <ListIcon className="h-4 w-4" />
              List
            </span>
            <span className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium text-zinc-500">
              <GridIcon className="h-4 w-4" />
              Grid
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-sage-100"
          >
            <DownloadIcon className="h-4 w-4" />
            Export
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
