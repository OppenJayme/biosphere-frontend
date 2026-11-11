/** Selectable table for immutable audit entries returned by the backend. */

"use client";

import {
  ArchiveIcon,
  ChatIcon,
  CubeIcon,
  DocumentTextIcon,
  MailIcon,
  MapPinIcon,
  UsersIcon,
} from "@/components/icons";
import { describeAuditEntry, moduleLabel } from "@/features/audit/describe";
import type { AuditLogEntry } from "@/features/audit/types";
import { UserAvatar } from "./UserAvatar";
import { labelFor } from "@/features/audit/label-key";

const MODULE_ICONS: Record<string, typeof DocumentTextIcon> = {
  specimens: DocumentTextIcon,
  cataloging: DocumentTextIcon,
  exhibits: CubeIcon,
  developer: UsersIcon,
  auth: UsersIcon,
  storage: MapPinIcon,
  "storage-locations": MapPinIcon,
  backup: ArchiveIcon,
  "visit-requests": MailIcon,
  inquiries: ChatIcon,
};

/** Only outcomes that need attention get a badge; a successful entry reads as a plain sentence. */
export const RESULT_BADGES = {
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700" },
  DENIED: { label: "Denied", className: "bg-amber-100 text-amber-800" },
} as const;

function moduleIcon(module: string) {
  return MODULE_ICONS[module.trim().toLowerCase()] ?? DocumentTextIcon;
}

export function formatAuditTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

export function AuditLogTable({
  logs,
  recordLabels,
  selectedId,
  onSelect,
}: {
  logs: AuditLogEntry[];
  recordLabels: Record<string, string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-black/15 px-4 py-12 text-center">
        <p className="text-sm font-medium text-zinc-800">No audit entries match these filters.</p>
        <p className="mt-1 text-xs text-zinc-500">Adjust or clear the filters and try again.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="py-2 pr-3 pl-3 font-medium">When</th>
            <th className="py-2 pr-3 font-medium">Activity</th>
            <th className="py-2 pr-0 font-medium">Module</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {logs.map((log) => {
            const Icon = moduleIcon(log.module);
            const selected = log.id === selectedId;
            const badge = log.result === "SUCCESS" ? null : RESULT_BADGES[log.result];

            return (
              <tr
                key={log.id}
                onClick={() => onSelect(log.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(log.id);
                  }
                }}
                tabIndex={0}
                aria-selected={selected}
                className={`cursor-pointer border-l-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-forest-600 ${
                  selected
                    ? "border-forest-600 bg-forest-50"
                    : "border-transparent hover:bg-sage-50"
                }`}
              >
                <td className="whitespace-nowrap py-3 pr-3 pl-3 text-zinc-600">
                  {formatAuditTimestamp(log.createdAt)}
                </td>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar actor={log.actor} size="h-7 w-7" />
                    <p className="text-zinc-800">
                      {describeAuditEntry(log, labelFor(recordLabels, log))}
                      {badge && (
                        <span
                          className={`ml-2 inline-block rounded-full px-2 py-0.5 align-middle text-[0.6875rem] font-medium whitespace-nowrap ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      )}
                    </p>
                  </div>
                </td>
                <td className="py-3 pr-0">
                  <span className="flex items-center gap-1.5 whitespace-nowrap text-zinc-600">
                    <Icon className="h-4 w-4 text-zinc-400" />
                    {moduleLabel(log.module)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
