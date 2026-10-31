"use client";

import { MenuIcon, SearchIcon } from "@/components/icons";
import { AccountMenu } from "./AccountMenu";
import { NotificationBell } from "./NotificationBell";
import { useSyncStatus } from "@/features/offline/use-sync-status";

function formatLastSynced(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "Last sync just now";
  if (minutes < 60) return `Last sync ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last sync ${hours}h ago`;
  return `Last sync ${Math.round(hours / 24)}d ago`;
}

export function CuratorTopbar({
  onMenuClick,
  onToggleCollapse,
  sidebarCollapsed,
  ownerId,
  profile,
}: {
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  sidebarCollapsed: boolean;
  ownerId: string;
  profile: { fullName: string; role: string } | null;
}) {
  const { online, lastSyncedAt } = useSyncStatus(ownerId);

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-black/10 bg-white/95 px-5 py-3 backdrop-blur">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="text-zinc-600 lg:hidden"
      >
        <MenuIcon className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        aria-expanded={!sidebarCollapsed}
        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden rounded-lg p-1.5 text-zinc-600 hover:bg-sage-100 hover:text-forest-800 lg:block"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {/* Global search (SRS 3.1.3 "search access"): a plain GET form, so it works without JavaScript. */}
      <form action="/specimens" role="search" className="relative hidden w-full max-w-md md:block">
        <label htmlFor="global-search" className="sr-only">
          Search specimens
        </label>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          id="global-search"
          type="search"
          name="search"
          maxLength={100}
          placeholder="Search specimens by name or accession no.…"
          className="w-full rounded-lg border border-black/10 bg-sage-50 py-2 pr-3 pl-9 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-forest-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-forest-700"
        />
      </form>

      <div className="ml-auto flex items-center gap-4">
        <span
          title={lastSyncedAt ? formatLastSynced(lastSyncedAt) : "No offline copy saved on this device yet"}
          className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${
            online ? "bg-forest-100 text-forest-800" : "bg-zinc-200 text-zinc-700"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-forest-600" : "bg-zinc-500"}`} />
          {online ? "Online" : "Offline"}
          <span className="font-normal text-zinc-500">
            · {lastSyncedAt ? formatLastSynced(lastSyncedAt).replace("Last sync ", "synced ") : "not synced yet"}
          </span>
        </span>

        <NotificationBell />

        <AccountMenu profile={profile} />
      </div>
    </header>
  );
}
