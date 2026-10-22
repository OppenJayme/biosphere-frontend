/** Read-only summary of the proposed backup schedule, retention, and recovery targets. */

import type { BackupPolicy } from "@/features/backup/types";
import { BackupNowButton } from "./BackupNowButton";

function hourLabel(hour: number) {
  const suffix = hour < 12 ? "a.m." : "p.m.";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${suffix}`;
}

export function BackupPolicyPanel({ policy, errorMessage }: { policy: BackupPolicy | null; errorMessage?: string }) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-4" aria-labelledby="backup-policy-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="backup-policy-heading" className="text-sm font-semibold text-zinc-900">
            Backup schedule and recovery
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Each backup is a private snapshot of all BioSphere records. Proposed targets are subject to restore testing.
          </p>
        </div>
        <BackupNowButton />
      </div>

      {errorMessage && <p className="mt-3 text-sm text-red-700">{errorMessage}</p>}

      {policy && (
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-sage-50 p-3">
            <dt className="text-xs text-zinc-500">Automatic backups</dt>
            <dd className="mt-1 font-medium text-zinc-900">
              {policy.scheduleHours.map(hourLabel).join(", ")}
            </dd>
            <dd className="mt-1 text-xs text-zinc-500">
              {policy.scheduleEnabled && policy.nextScheduledAt
                ? `Next: ${new Date(policy.nextScheduledAt).toLocaleString("en-PH", { timeZone: policy.timeZone, dateStyle: "medium", timeStyle: "short" })}`
                : "Scheduler is off on this server"}
            </dd>
          </div>
          <div className="rounded-lg bg-sage-50 p-3">
            <dt className="text-xs text-zinc-500">Retention</dt>
            <dd className="mt-1 font-medium text-zinc-900">
              All points for {policy.retention.keepAllHours} hours
            </dd>
            <dd className="mt-1 text-xs text-zinc-500">
              Then one daily for {policy.retention.dailyDays} days and one weekly for {policy.retention.weeklyWeeks} weeks
            </dd>
          </div>
          <div className="rounded-lg bg-sage-50 p-3">
            <dt className="text-xs text-zinc-500">Most changes that could be lost</dt>
            <dd className="mt-1 font-medium text-zinc-900">{policy.targets.recoveryPointHours} hours</dd>
          </div>
          <div className="rounded-lg bg-sage-50 p-3">
            <dt className="text-xs text-zinc-500">Restoration target</dt>
            <dd className="mt-1 font-medium text-zinc-900">Within {policy.targets.recoveryTimeHours} hours</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
