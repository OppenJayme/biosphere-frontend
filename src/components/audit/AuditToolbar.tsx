import { SearchIcon, ChevronDownIcon, CalendarIcon, DownloadIcon } from "@/components/icons";
import { LOG_CATEGORIES, type AUDIT_FILTERS, type LogCategory } from "@/lib/dummy-data/audit-logs";

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

export function AuditToolbar({
  filters,
  category,
  onCategoryChange,
}: {
  filters: typeof AUDIT_FILTERS;
  category: LogCategory;
  onCategoryChange: (category: LogCategory) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-1">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search logs..."
            className="w-full rounded-lg border border-black/15 py-2 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
        </div>
        <FilterSelect options={filters.module} />
        <FilterSelect options={filters.action} />
        <FilterSelect options={filters.user} />
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm text-zinc-700 hover:bg-sage-100"
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          <span className="truncate">May 20 &ndash; May 22, 2025</span>
          <ChevronDownIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-400" />
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
        >
          <DownloadIcon className="h-4 w-4" />
          Export
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {LOG_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onCategoryChange(c)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              category === c ? "bg-forest-700 text-white" : "text-zinc-600 hover:bg-sage-100"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
