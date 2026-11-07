/** Pure helpers that turn curator accounts into what the Users page renders. */

import type { AccountUser, UserAccount, UserStatus, UserStatusFilter } from "./types";

const DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "Asia/Manila" });
const DATE_TIME = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

// Brand greens and earth tones only, so avatars match the rest of the curator UI.
const AVATAR_COLORS = [
  "bg-forest-700",
  "bg-forest-900",
  "bg-forest-600",
  "bg-amber-700",
  "bg-stone-600",
] as const;

export function formatDate(iso: string) {
  return DATE.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return DATE_TIME.format(new Date(iso));
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Same account, same color on every render. */
function avatarColor(id: string) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function userStatus(account: Pick<UserAccount, "status" | "inviteAccepted">): UserStatus {
  if (account.status === "INACTIVE") return "Inactive";
  return account.inviteAccepted ? "Active" : "Pending Invite";
}

export type CuratorStatusChange = {
  status: "ACTIVE" | "INACTIVE";
  label: "Activate" | "Deactivate";
  doneTitle: string;
  description: string;
  tone: "primary" | "danger";
};

/**
 * What the status control offers. Curators only reactivate: the Curator answered on 2026-11-07 that
 * one curator should not turn off another's account, so deactivation happens through the outgoing
 * curator's own handover, or the Developer route.
 */
export function curatorStatusAction(status: UserStatus): CuratorStatusChange {
  return status === "Inactive"
    ? {
        status: "ACTIVE",
        label: "Activate",
        doneTitle: "Account activated",
        description: "They will be able to sign in and use BioSphere again.",
        tone: "primary",
      }
    : {
        status: "INACTIVE",
        label: "Deactivate",
        doneTitle: "Account deactivated",
        description: "They lose access right away and cannot sign in. Their account and history are kept.",
        tone: "danger",
      };
}

export function toAccountUser(account: UserAccount, currentAccountId: string | null): AccountUser {
  return {
    id: account.id,
    name: account.fullName,
    email: account.email,
    status: userStatus(account),
    isCurrentUser: account.id === currentAccountId,
    lastSignIn: account.lastSignInAt ? formatDateTime(account.lastSignInAt) : null,
    lastSignInDate: account.lastSignInAt ? formatDate(account.lastSignInAt) : null,
    createdOn: formatDate(account.createdAt),
    createdOnFull: formatDateTime(account.createdAt),
    initials: initialsOf(account.fullName),
    color: avatarColor(account.id),
  };
}

type Tone = "positive" | "warning" | "danger" | "neutral";
export type UserStat = {
  label: string;
  value: string;
  note: string;
  tone: Tone;
  icon: "specimen" | "clock" | "mail" | "lock";
};

function shareOf(count: number, total: number) {
  return total === 0 ? "No curators yet" : `${((count / total) * 100).toFixed(1)}% of total`;
}

export function buildUserStats(users: AccountUser[]): UserStat[] {
  const total = users.length;
  const count = (status: UserStatus) => users.filter((user) => user.status === status).length;
  const active = count("Active");
  const pending = count("Pending Invite");
  const inactive = count("Inactive");

  return [
    { label: "Total Curators", value: total.toLocaleString(), note: "Curator accounts", tone: "neutral", icon: "specimen" },
    { label: "Active Curators", value: active.toLocaleString(), note: shareOf(active, total), tone: "positive", icon: "clock" },
    {
      label: "Pending Invitations",
      value: pending.toLocaleString(),
      note: shareOf(pending, total),
      tone: pending > 0 ? "warning" : "neutral",
      icon: "mail",
    },
    {
      label: "Inactive Accounts",
      value: inactive.toLocaleString(),
      note: shareOf(inactive, total),
      tone: inactive > 0 ? "danger" : "neutral",
      icon: "lock",
    },
  ];
}

export type UserFilters = { search: string; status: UserStatusFilter };

export function filterUsers(users: AccountUser[], { search, status }: UserFilters) {
  const needle = search.trim().toLowerCase();
  return users.filter((user) => {
    if (status && user.status !== status) return false;
    if (!needle) return true;
    return user.name.toLowerCase().includes(needle) || (user.email?.toLowerCase().includes(needle) ?? false);
  });
}
