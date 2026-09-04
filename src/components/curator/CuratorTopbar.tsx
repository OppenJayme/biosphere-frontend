import { SearchIcon, BellIcon, ChevronDownIcon, MenuIcon } from "@/components/icons";
import { CURATOR, SYNC_STATUS } from "@/lib/dummy-data/dashboard";

export function CuratorTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-black/10 bg-white/95 px-5 py-3.5 backdrop-blur">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="text-zinc-600 lg:hidden"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <div className="relative hidden max-w-xl flex-1 sm:block">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          placeholder="Search accession no, scientific name, collector, location..."
          className="w-full rounded-lg border border-black/15 py-2 pl-10 pr-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        />
      </div>

      <div className="ml-auto flex items-center gap-5">
        <div className="hidden flex-col items-end text-xs leading-tight md:flex">
          <span className="flex items-center gap-1.5 text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-forest-600" />
            {SYNC_STATUS.lastSyncLabel}
          </span>
          {SYNC_STATUS.offlineReady && (
            <span className="flex items-center gap-1.5 text-forest-700">
              <span className="h-1.5 w-1.5 rounded-full bg-forest-600" />
              Offline-ready
            </span>
          )}
        </div>

        <button type="button" aria-label="Notifications" className="relative text-zinc-600">
          <BellIcon className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button type="button" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-700 text-xs font-semibold text-white">
            {CURATOR.initials}
          </span>
          <span className="hidden flex-col items-start leading-tight sm:flex">
            <span className="text-[11px] text-zinc-500">{CURATOR.role}</span>
            <span className="text-sm font-semibold text-forest-900">{CURATOR.name}</span>
          </span>
          <ChevronDownIcon className="hidden h-4 w-4 text-zinc-400 sm:block" />
        </button>
      </div>
    </header>
  );
}
