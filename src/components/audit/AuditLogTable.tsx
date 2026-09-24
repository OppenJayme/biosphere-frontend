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
import type { AuditLogEntry } from "@/features/audit/types";
import { UserAvatar, actorName } from "./UserAvatar";

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

const RESULT_STYLES = {
  SUCCESS: "bg-forest-100 text-forest-700",
  FAILED: "bg-red-100 text-red-700",
  DENIED: "bg-amber-100 text-amber-700",
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

export function summarizeAuditDetails(details: unknown) {
  if (details === null || details === undefined) return "No additional details";
  if (typeof details === "string") return details;

  try {
    return JSON.stringify(details);
  } catch {
    return "Additional details could not be displayed";
  }
}

function affectedRecordLabel(log: AuditLogEntry) {
  if (!log.affectedRecordId && !log.affectedRecordType) return "—";
  if (!log.affectedRecordId) return log.affectedRecordType ?? "—";
  if (!log.affectedRecordType) return log.affectedRecordId;
  return `${log.affectedRecordType} · ${log.affectedRecordId}`;
}

export function AuditLogTable({
  logs,
  selectedId,
  onSelect,
}: {
  logs: AuditLogEntry[];
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
      <table className="w-full min-w-[1040px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="py-2 pr-3 font-medium">Timestamp</th>
            <th className="py-2 pr-3 font-medium">Actor</th>
            <th className="py-2 pr-3 font-medium">Module</th>
            <th className="py-2 pr-3 font-medium">Action</th>
            <th className="py-2 pr-3 font-medium">Affected record</th>
            <th className="py-2 pr-3 font-medium">Details</th>
            <th className="py-2 pr-0 font-medium">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {logs.map((log) => {
            const Icon = moduleIcon(log.module);
            const selected = log.id === selectedId;

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
                className={`cursor-pointer border-l-4 transition-colors ${
                  selected
                    ? "border-forest-600 bg-forest-50"
                    : "border-transparent hover:bg-sage-50"
                }`}
              >
                <td className="whitespace-nowrap py-2.5 pr-3 text-zinc-600">
                  {formatAuditTimestamp(log.createdAt)}
                </td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar actor={log.actor} size="h-7 w-7" />
                    <span className="whitespace-nowrap font-medium text-zinc-800">
                      {actorName(log.actor)}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-1.5 whitespace-nowrap text-zinc-700">
                    <Icon className="h-4 w-4 text-zinc-400" />
                    {log.module}
                  </span>
                </td>
                <td className="whitespace-nowrap py-2.5 pr-3 text-zinc-700">{log.action}</td>
                <td className="max-w-[240px] truncate py-2.5 pr-3 text-zinc-600">
                  {affectedRecordLabel(log)}
                </td>
                <td className="max-w-[260px] truncate py-2.5 pr-3 text-zinc-600">
                  {summarizeAuditDetails(log.details)}
                </td>
                <td className="py-2.5 pr-0">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${RESULT_STYLES[log.result]}`}
                  >
                    {log.result}
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
