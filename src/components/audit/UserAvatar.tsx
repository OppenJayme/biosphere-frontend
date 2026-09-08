import { GearIcon, UserIcon } from "@/components/icons";
import type { LogActor } from "@/lib/dummy-data/audit-logs";

export function UserAvatar({ actor, size = "h-8 w-8" }: { actor: LogActor; size?: string }) {
  if (actor.kind === "system") {
    return (
      <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-500`}>
        <GearIcon className="h-4 w-4" />
      </span>
    );
  }

  if (actor.kind === "unknown") {
    return (
      <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-400`}>
        <UserIcon className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${actor.color}`}>
      {actor.initials}
    </span>
  );
}

export function actorName(actor: LogActor): string {
  if (actor.kind === "system") return "System";
  if (actor.kind === "unknown") return "Unknown User";
  return actor.name;
}
