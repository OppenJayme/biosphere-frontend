import { CalendarIcon, ChevronDownIcon, FilterIcon } from "@/components/icons";

function FilterField({ label, options }: { label: string; options: string[] }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-zinc-700">{label}</label>
      <div className="relative">
        <select
          defaultValue={options[0]}
          className="w-full appearance-none rounded-lg border border-black/15 bg-white py-2.5 pl-3 pr-8 text-sm text-zinc-700 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
      </div>
    </div>
  );
}

export function ReportFiltersPanel() {
  return (
    <div className="rounded-xl border border-black/10 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">Report Filters</h2>
        <button type="button" className="text-xs font-medium text-forest-700 hover:text-forest-800">
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-700">Date Range</label>
          <button
            type="button"
            className="flex w-full items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2.5 text-sm text-zinc-700 hover:bg-sage-50"
          >
            <CalendarIcon className="h-4 w-4 shrink-0 text-zinc-400" />
            <span className="truncate">May 1, 2025 &ndash; May 22, 2025</span>
            <ChevronDownIcon className="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FilterField label="Collection Type" options={["All Collection Types", "Entomology", "Herpetology", "Mammalogy", "Marine Biology", "Botany"]} />
          <FilterField label="Category" options={["All Categories", "Vertebrate", "Invertebrate", "Plant"]} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FilterField
            label="Storage Location"
            options={["All Locations", "Herpetology Room 1", "Entomology Cabinet 004", "Mammalogy Cabinet 002", "Marine Glass Display 001"]}
          />
          <FilterField label="Condition" options={["All Conditions", "Good", "Fair", "Poor"]} />
        </div>
      </div>

      <button
        type="button"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
      >
        <FilterIcon className="h-4 w-4" />
        Apply Filters
      </button>
    </div>
  );
}
