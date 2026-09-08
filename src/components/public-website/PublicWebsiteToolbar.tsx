import { SearchIcon, ChevronDownIcon, CalendarIcon, DownloadIcon, ChatIcon } from "@/components/icons";

export type WebsiteTab = "inquiries" | "visits";

export function PublicWebsiteToolbar({
  tab,
  onTabChange,
  statusOptions,
}: {
  tab: WebsiteTab;
  onTabChange: (tab: WebsiteTab) => void;
  statusOptions: readonly string[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onTabChange("inquiries")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "inquiries" ? "bg-forest-700 text-white" : "border border-black/15 text-zinc-700 hover:bg-sage-100"
          }`}
        >
          <ChatIcon className="h-4 w-4" />
          General Inquiries
        </button>
        <button
          type="button"
          onClick={() => onTabChange("visits")}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === "visits" ? "bg-forest-700 text-white" : "border border-black/15 text-zinc-700 hover:bg-sage-100"
          }`}
        >
          <CalendarIcon className="h-4 w-4" />
          Visit Request
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            placeholder="Search inquiries..."
            className="w-full rounded-lg border border-black/15 py-2 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
          />
        </div>
        <div className="relative">
          <select
            defaultValue={statusOptions[0]}
            className="w-full appearance-none rounded-lg border border-black/15 bg-white py-2 pl-3 pr-8 text-sm text-zinc-700 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
          >
            {statusOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3 py-2 text-sm text-zinc-700 hover:bg-sage-100"
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-zinc-400" />
          <span className="truncate">May 15 &ndash; May 22, 2025</span>
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
    </div>
  );
}
