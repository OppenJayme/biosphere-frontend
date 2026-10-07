"use client";

import { MenuIcon } from "@/components/icons";
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

        <NotificationBell />

        <AccountMenu profile={profile} />
      </div>
    </header>
  );
}
