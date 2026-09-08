import type { ComponentType, ReactNode, SVGProps } from "react";
import {
  CloseIcon,
  DocumentTextIcon,
  CubeIcon,
  UsersIcon,
  MapPinIcon,
  ArchiveIcon,
  MailIcon,
  ChatIcon,
  GlobeIcon,
  PhoneIcon,
  ClockIcon,
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
      <span className="text-right font-medium text-zinc-800">{children}</span>
    </div>
  );
}

export function AuditLogDetailPanel({ log, onClear }: { log: AuditLog | null; onClear: () => void }) {
  if (!log) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">Selected Log</h3>
        <p className="py-6 text-center text-xs text-zinc-500">
          Select a log entry from the table to see its details here.
        </p>
      </div>
    );
  }

  const ModuleIcon = MODULE_ICONS[log.module] ?? DocumentTextIcon;

  return (
    <div className="space-y-4 rounded-xl border border-black/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Selected Log</h3>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="text-zinc-400 hover:text-zinc-600"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-sage-50 px-3 py-2">
        <span className={`h-2 w-2 rounded-full ${log.result === "Success" ? "bg-forest-600" : "bg-red-500"}`} />
        <span className={`text-xs font-semibold ${log.result === "Success" ? "text-forest-700" : "text-red-600"}`}>
          {log.result}
        </span>
        <span className="ml-auto truncate text-xs text-zinc-500">Log ID: {log.id}</span>
      </div>

      <div className="divide-y divide-black/5">
        <InfoRow icon={ClockIcon} label="Timestamp">
          {log.timestampFull}
        </InfoRow>
        <InfoRow icon={UsersIcon} label="User">
          <span className="flex items-center gap-1.5">
            <UserAvatar actor={log.actor} size="h-5 w-5" />
            {actorName(log.actor)}
          </span>
        </InfoRow>
        <InfoRow icon={UsersIcon} label="Role">
          {log.role}
        </InfoRow>
        <InfoRow icon={GlobeIcon} label="IP Address">
          {log.ipAddress}
        </InfoRow>
        <InfoRow icon={PhoneIcon} label="Device / Browser">
          {log.device}
        </InfoRow>
        <InfoRow icon={ModuleIcon} label="Module">
          {log.module}
        </InfoRow>
        <InfoRow icon={DocumentTextIcon} label="Action">
          {log.action}
        </InfoRow>
        <InfoRow icon={ArchiveIcon} label="Affected Record">
          {log.affectedRecord}
        </InfoRow>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-zinc-500">Details</p>
        <p className="rounded-lg bg-sage-50 px-3 py-2.5 text-xs text-zinc-700">{log.details}</p>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-zinc-500">Result</span>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
            log.result === "Success" ? "bg-forest-100 text-forest-700" : "bg-red-100 text-red-600"
          }`}
        >
          {log.result}
        </span>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium text-zinc-500">Timeline</p>
        <ul className="space-y-3">
          {log.timeline.map((step, i) => (
            <li key={step.time + step.label} className="flex gap-2.5">
              <span className="flex flex-col items-center">
                <span className="h-2 w-2 shrink-0 rounded-full bg-forest-600" />
                {i < log.timeline.length - 1 && <span className="mt-0.5 h-full w-px flex-1 bg-black/10" />}
              </span>
              <span className="-mt-0.5 pb-1 text-xs">
                <span className="font-medium text-zinc-800">{step.time}</span>{" "}
                <span className="text-zinc-500">{step.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
