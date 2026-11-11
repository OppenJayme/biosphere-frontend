"use client";

/**
 * Connection and offline-draft sync states for the dashboard (REQ-4.3-03).
 * Drafts live in this browser's IndexedDB, so the counts are read here, not
 * from the backend. Mounting the shared hook also retries pending drafts once
 * the connection is stable, as the specimens page does.
 */

import Link from "next/link";
import { SYNC_STATES, type SyncState } from "@/features/offline/types";
import { useOfflineSpecimens } from "@/features/offline/use-offline-specimens";

const STATE_LABELS: Record<SyncState, string> = {
  PENDING_SYNC: "Pending Sync",
  SYNCHRONIZING: "Synchronizing",
  SYNCHRONIZED: "Synchronized",
  SYNC_FAILED: "Sync Failed",
};

const STATE_STYLES: Record<SyncState, string> = {
  PENDING_SYNC: "bg-amber-100 text-amber-800",
  SYNCHRONIZING: "bg-sky-100 text-sky-800",
  SYNCHRONIZED: "bg-forest-100 text-forest-800",
  SYNC_FAILED: "bg-red-100 text-red-800",
};

export function OfflineSyncStatus({ ownerId }: { ownerId: string }) {
  const { drafts, online, isSynchronizing } = useOfflineSpecimens(ownerId);
  const counts = new Map<SyncState, number>(SYNC_STATES.map((state) => [state, 0]));
  for (const draft of drafts) counts.set(draft.syncState, (counts.get(draft.syncState) ?? 0) + 1);
  const failed = counts.get("SYNC_FAILED") ?? 0;

  return (
    <div className="space-y-3 text-sm">
      <p className="flex items-center gap-2" role="status">
        <span className={`h-2 w-2 rounded-full ${online ? "bg-forest-600" : "bg-zinc-400"}`} aria-hidden />
        <span className="font-medium text-zinc-800">{online ? "Online" : "Offline"}</span>
        {isSynchronizing && <span className="text-xs text-sky-700">Synchronizing drafts…</span>}
      </p>

      {drafts.length === 0 ? (
        <p className="text-xs text-zinc-500">No offline drafts on this device.</p>
      ) : (
        <ul className="space-y-1.5">
          {SYNC_STATES.map((state) => (
            <li key={state} className="flex items-center justify-between gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-semibold ${STATE_STYLES[state]}`}>
                {STATE_LABELS[state]}
              </span>
              <span className="text-xs font-semibold text-zinc-700">{counts.get(state) ?? 0}</span>
            </li>
          ))}
        </ul>
      )}

      {failed > 0 && (
        <p className="text-xs text-red-700">
          {failed === 1 ? "1 draft" : `${failed} drafts`} could not sync. Review the error and retry.
        </p>
      )}

      <Link
        href="/specimens#offline-records-heading"
        className="inline-flex text-xs font-semibold text-forest-700 hover:text-forest-800"
      >
        Review offline drafts &rarr;
      </Link>
    </div>
  );
}
