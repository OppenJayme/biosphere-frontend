"use client";

import { BellIcon, ChevronDownIcon, MenuIcon } from "@/components/icons";
import { useSyncStatus } from "@/features/offline/use-sync-status";

function initialsFor(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

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
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-black/10 bg-white/95 px-5 py-3.5 backdrop-blur">
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

      <div className="ml-auto flex items-center gap-5">
        <div className="hidden flex-col items-end text-xs leading-tight md:flex">
          <span className="flex items-center gap-1.5 text-zinc-600">
            <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-forest-600" : "bg-zinc-400"}`} />
            {lastSyncedAt ? formatLastSynced(lastSyncedAt) : "No offline cache yet"}
          </span>
          <span className={`flex items-center gap-1.5 ${online ? "text-forest-700" : "text-zinc-500"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-forest-600" : "bg-zinc-400"}`} />
            {online ? "Online" : "Offline"}
          </span>
        </div>

        <button type="button" aria-label="Notifications" className="relative text-zinc-600">
          <BellIcon className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <button type="button" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-700 text-xs font-semibold text-white">
            {profile ? initialsFor(profile.fullName) : "?"}
          </span>
          <span className="hidden flex-col items-start leading-tight sm:flex">
            <span className="text-[11px] text-zinc-500">
              {profile ? profile.role.charAt(0) + profile.role.slice(1).toLowerCase() : "Signed in"}
            </span>
            <span className="text-sm font-semibold text-forest-900">
              {profile ? profile.fullName : "Curator account unavailable"}
            </span>
          </span>
          <ChevronDownIcon className="hidden h-4 w-4 text-zinc-400 sm:block" />
        </button>
      </div>
    </header>
  );
}
