"use client";

import {
  DocumentTextIcon,
  CubeIcon,
  UsersIcon,
  MapPinIcon,
  ArchiveIcon,
  MailIcon,
  ChatIcon,
  ChevronDownIcon,
} from "@/components/icons";
import { UserAvatar, actorName } from "./UserAvatar";
import type { AuditLog } from "@/lib/dummy-data/audit-logs";

const MODULE_ICONS: Record<string, typeof DocumentTextIcon> = {
  Cataloging: DocumentTextIcon,
  "QR Exhibits": CubeIcon,
  "User Management": UsersIcon,
  Location: MapPinIcon,
  Backup: ArchiveIcon,
  "Visit Requests": MailIcon,
  Inquiries: ChatIcon,
};

export function AuditLogTable({
  logs,
  selectedId,
  onSelect,
}: {
  logs: AuditLog[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/10 text-xs text-zinc-500">
            <th className="py-2 pr-3 font-medium">
              <span className="flex items-center gap-1">
                Timestamp
                <ChevronDownIcon className="h-3 w-3" />
              </span>
            </th>
            <th className="py-2 pr-3 font-medium">User</th>
            <th className="py-2 pr-3 font-medium">Module</th>
            <th className="py-2 pr-3 font-medium">Action</th>
            <th className="py-2 pr-3 font-medium">Affected Record</th>
            <th className="py-2 pr-3 font-medium">Details / Summary</th>
            <th className="py-2 pr-0 font-medium">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {logs.map((log) => {
            const Icon = MODULE_ICONS[log.module] ?? DocumentTextIcon;
            const selected = log.id === selectedId;
            return (
              <tr
                key={log.id}
                onClick={() => onSelect(log.id)}
                className={`cursor-pointer border-l-4 transition-colors ${
                  selected ? "border-forest-600 bg-forest-50" : "border-transparent hover:bg-sage-50"
                }`}
              >
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{log.timestamp}</td>
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar actor={log.actor} size="h-7 w-7" />
                    <span className="whitespace-nowrap font-medium text-zinc-800">{actorName(log.actor)}</span>
                  </div>
                </td>
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-1.5 whitespace-nowrap text-zinc-700">
                    <Icon className="h-4 w-4 text-zinc-400" />
                    {log.module}
                  </span>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-700">{log.action}</td>
                <td className="py-2.5 pr-3 whitespace-nowrap text-zinc-600">{log.affectedRecord}</td>
                <td className="max-w-[260px] truncate py-2.5 pr-3 text-zinc-600">{log.details}</td>
                <td className="py-2.5 pr-0">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
                      log.result === "Success" ? "bg-forest-100 text-forest-700" : "bg-red-100 text-red-600"
                    }`}
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
