/** Read-only view of the fields actually persisted by the audit backend. */

import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  ArchiveIcon,
  ClockIcon,
  CloseIcon,
  DocumentTextIcon,
  UsersIcon,
} from "@/components/icons";
import type { AuditLogEntry } from "@/features/audit/types";
import { formatAuditTimestamp, summarizeAuditDetails } from "./AuditLogTable";
import { UserAvatar, actorName } from "./UserAvatar";

const RESULT_STYLES = {
  SUCCESS: "bg-forest-100 text-forest-700",
  FAILED: "bg-red-100 text-red-700",
  DENIED: "bg-amber-100 text-amber-700",
} as const;

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 text-xs">
      <span className="flex items-center gap-1.5 text-zinc-500">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
      <span className="max-w-[190px] break-words text-right font-medium text-zinc-800">
        {children}
      </span>
    </div>
  );
}

export function AuditLogDetailPanel({
  log,
  onClear,
}: {
  log: AuditLogEntry | null;
  onClear: () => void;
}) {
  if (!log) {
    return (
      <aside className="rounded-xl border border-black/10 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Selected log</h2>
        <p className="py-6 text-center text-xs text-zinc-500">
          Select an audit entry to inspect its recorded details.
        </p>
      </aside>
    );
  }

  return (
    <aside className="space-y-4 rounded-xl border border-black/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Selected log</h2>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selected audit log"
          className="text-zinc-400 hover:text-zinc-600"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2">
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${RESULT_STYLES[log.result]}`}>
          {log.result}
        </span>
        <span className="ml-auto truncate text-xs text-zinc-500" title={log.id}>
          {log.id}
        </span>
      </div>

      <div className="divide-y divide-black/5">
        <InfoRow icon={ClockIcon} label="Timestamp">
          {formatAuditTimestamp(log.createdAt)}
        </InfoRow>
        <InfoRow icon={UsersIcon} label="Actor">
          <span className="inline-flex items-center gap-1.5">
            <UserAvatar actor={log.actor} size="h-5 w-5" />
            {actorName(log.actor)}
          </span>
        </InfoRow>
        <InfoRow icon={UsersIcon} label="Role">
          {log.actor?.role ?? "Unavailable"}
        </InfoRow>
        <InfoRow icon={DocumentTextIcon} label="Module">
          {log.module}
        </InfoRow>
        <InfoRow icon={DocumentTextIcon} label="Action">
          {log.action}
        </InfoRow>
        <InfoRow icon={ArchiveIcon} label="Record type">
          {log.affectedRecordType ?? "Not recorded"}
        </InfoRow>
        <InfoRow icon={ArchiveIcon} label="Record ID">
          {log.affectedRecordId ?? "Not recorded"}
        </InfoRow>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-zinc-500">Structured details</p>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-sage-50 px-3 py-2.5 text-xs text-zinc-700">
          {typeof log.details === "object" && log.details !== null
            ? JSON.stringify(log.details, null, 2)
            : summarizeAuditDetails(log.details)}
        </pre>
      </div>
    </aside>
  );
}
