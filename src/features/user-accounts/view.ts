/** Pure helpers that turn user accounts into what the Users page renders. */

import type { AccountUser, UserAccount, UserRole, UserRoleFilter, UserStatus, UserStatusFilter } from "./types";

const DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "Asia/Manila" });
const DATE_TIME = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});

const AVATAR_COLORS = [
  "bg-forest-700",
  "bg-amber-700",
  "bg-sky-600",
  "bg-violet-600",
  "bg-rose-500",
  "bg-forest-900",
] as const;

const ROLE_LABELS: Record<UserAccount["role"], UserRole> = {
  CURATOR: "Curator",
  DEVELOPER: "Developer",
};

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

export function toAccountUser(account: UserAccount, currentAccountId: string | null): AccountUser {
  return {
    id: account.id,
    name: account.fullName,
    email: account.email,
    role: ROLE_LABELS[account.role],
    status: userStatus(account),
    isCurrentUser: account.id === currentAccountId,
    lastSignIn: account.lastSignInAt ? formatDateTime(account.lastSignInAt) : null,
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
  return total === 0 ? "No users yet" : `${((count / total) * 100).toFixed(1)}% of total`;
}

function plural(count: number, singular: string) {
  return `${count.toLocaleString()} ${count === 1 ? singular : `${singular}s`}`;
}

export function buildUserStats(users: AccountUser[]): UserStat[] {
  const total = users.length;
  const count = (status: UserStatus) => users.filter((user) => user.status === status).length;
  const active = count("Active");
  const pending = count("Pending Invite");
  const inactive = count("Inactive");
  const curators = users.filter((user) => user.role === "Curator").length;

  return [
    {
      label: "Total Users",
      value: total.toLocaleString(),
      note: `${plural(curators, "curator")} · ${plural(total - curators, "developer")}`,
      tone: "neutral",
      icon: "specimen",
    },
    { label: "Active Users", value: active.toLocaleString(), note: shareOf(active, total), tone: "positive", icon: "clock" },
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

export type UserFilters = { search: string; role: UserRoleFilter; status: UserStatusFilter };

export function filterUsers(users: AccountUser[], { search, role, status }: UserFilters) {
  const needle = search.trim().toLowerCase();
  return users.filter((user) => {
    if (role && user.role !== role) return false;
    if (status && user.status !== status) return false;
    if (!needle) return true;
    return user.name.toLowerCase().includes(needle) || (user.email?.toLowerCase().includes(needle) ?? false);
  });
}

export function humanizeAction(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
