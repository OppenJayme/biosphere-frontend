/** Read-only, plain-language view of one audit entry. Identifiers and raw JSON are not shown. */

import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  ArchiveIcon,
  ClockIcon,
  CloseIcon,
  DocumentTextIcon,
  UsersIcon,
} from "@/components/icons";
import { auditDetailRows, describeAuditEntry, humanizeCode, moduleLabel } from "@/features/audit/describe";
import type { AuditLogEntry } from "@/features/audit/types";
import { RESULT_BADGES, formatAuditTimestamp } from "./AuditLogTable";
import { UserAvatar, actorName } from "./UserAvatar";
import { labelFor } from "@/features/audit/label-key";

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

const ROLE_LABELS = { CURATOR: "Curator", DEVELOPER: "Developer" } as const;

export function AuditLogDetailPanel({
  log,
  recordLabels,
  onClear,
}: {
  log: AuditLogEntry | null;
  recordLabels: Record<string, string>;
  onClear: () => void;
}) {
  if (!log) {
    return (
      <aside className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Selected entry</h2>
        <p className="py-6 text-center text-xs text-zinc-500">
          Select an audit entry to see what happened.
        </p>
      </aside>
    );
  }

  const badge = log.result === "SUCCESS" ? null : RESULT_BADGES[log.result];
  const details = auditDetailRows(log.details);

  return (
    <aside className="space-y-4 rounded-xl border border-black/10 bg-white p-5 xl:sticky xl:top-20">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">Selected entry</h2>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selected audit entry"
          className="text-zinc-400 hover:text-zinc-600"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="rounded-lg bg-sage-50 px-3 py-2.5">
        <p className="text-sm text-zinc-900">{describeAuditEntry(log, labelFor(recordLabels, log))}</p>
        <span
          className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${
            badge ? badge.className : "bg-forest-100 text-forest-700"
          }`}
        >
          {badge ? badge.label : "Successful"}
        </span>
      </div>

      <div className="divide-y divide-black/5">
        <InfoRow icon={ClockIcon} label="When">
          {formatAuditTimestamp(log.createdAt)}
        </InfoRow>
        <InfoRow icon={UsersIcon} label="Who">
          <span className="inline-flex items-center gap-1.5">
            <UserAvatar actor={log.actor} size="h-5 w-5" />
            {actorName(log.actor)}
          </span>
        </InfoRow>
        {log.actor && (
          <InfoRow icon={UsersIcon} label="Role">
            {ROLE_LABELS[log.actor.role]}
          </InfoRow>
        )}
        <InfoRow icon={DocumentTextIcon} label="Module">
          {moduleLabel(log.module)}
        </InfoRow>
        {log.affectedRecordType && (
          <InfoRow icon={ArchiveIcon} label="Record type">
            {moduleLabel(humanizeCode(log.affectedRecordType))}
          </InfoRow>
        )}
      </div>

      {details.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">Recorded details</p>
          <dl className="divide-y divide-black/5">
            {details.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-3 py-2 text-xs">
                <dt className="text-zinc-500">{row.label}</dt>
                <dd className="max-w-[190px] break-words text-right font-medium text-zinc-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </aside>
  );
}
