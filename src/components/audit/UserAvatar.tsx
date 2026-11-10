/** Compact actor identity used by the protected audit table and detail panel. */

import { UserIcon } from "@/components/icons";
import type { AuditLogEntry } from "@/features/audit/types";

type AuditActor = AuditLogEntry["actor"];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserAvatar({ actor, size = "h-8 w-8" }: { actor: AuditActor; size?: string }) {
  if (!actor) {
    return (
      <span
        className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400`}
      >
        <UserIcon className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-forest-700 text-xs font-semibold text-white`}
      title={`${actor.fullName} (${actor.role})`}
    >
      {initials(actor.fullName) || "?"}
    </span>
  );
}

export function actorName(actor: AuditActor) {
  return actor?.fullName ?? "System or unavailable actor";
}
