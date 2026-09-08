import type { Metadata } from "next";
import { StatCard } from "@/components/ui/StatCard";
import { AuditLogsWorkspace } from "@/components/audit/AuditLogsWorkspace";
import { AUDIT_LOGS, AUDIT_FILTERS, AUDIT_STATS } from "@/lib/dummy-data/audit-logs";

export const metadata: Metadata = {
  title: "Audit Logs",
};

export default function AuditLogsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-forest-800">Audit Logs</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Review system activity, user actions, and security-related events.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {AUDIT_STATS.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <AuditLogsWorkspace logs={AUDIT_LOGS} filters={AUDIT_FILTERS} />
    </div>
  );
}
