import Link from "next/link";
import type { ReactNode } from "react";
import {
  PencilIcon,
  LockIcon,
  UserXIcon,
  MailIcon,
  RefreshIcon,
  ClockIcon,
  CalendarIcon,
  ShieldIcon,
  CheckIcon,
  ArrowRightIcon,
} from "@/components/icons";
import type { CuratorUser, UserStatus } from "@/lib/dummy-data/users";

const STATUS_STYLES: Record<UserStatus, string> = {
  Active: "bg-forest-100 text-forest-700",
  "Pending Invite": "bg-amber-100 text-amber-700",
  Inactive: "bg-red-100 text-red-600",
};

function InfoRow({ icon: Icon, label, children }: { icon: typeof ClockIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-xs">
      <span className="flex items-center gap-1.5 text-zinc-500">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
      <span className="text-right font-medium text-zinc-800">{children}</span>
    </div>
  );
}

export function UserDetailPanel({ user }: { user: CuratorUser | null }) {
  if (!user) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">Selected User</h3>
        <p className="py-6 text-center text-xs text-zinc-500">
          Select a user from the table to see their details here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${user.color}`}>
            {user.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-zinc-900">{user.name}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_STYLES[user.status]}`}>
            {user.status}
          </span>
        </div>

        <div className="mt-3 divide-y divide-black/5 border-t border-black/5">
          <InfoRow icon={ShieldIcon} label="Role">
            {user.role}
          </InfoRow>
          <InfoRow icon={CheckIcon} label="Status">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[user.status]}`}>{user.status}</span>
          </InfoRow>
          <InfoRow icon={ClockIcon} label="Last Sign-in">
            {user.lastSignIn ?? "Never signed in"}
          </InfoRow>
          <InfoRow icon={CalendarIcon} label="Created On">
            {user.createdOnFull}
          </InfoRow>
        </div>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">Account Actions</h3>
        <div className="space-y-2">
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg border border-black/15 px-3.5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-sage-100"
          >
            <PencilIcon className="h-4 w-4" />
            Edit Profile
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg border border-black/15 px-3.5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-sage-100"
          >
            <LockIcon className="h-4 w-4" />
            Reset Password
          </button>
          {user.status === "Inactive" ? (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg border border-forest-700 px-3.5 py-2.5 text-sm font-medium text-forest-700 hover:bg-forest-50"
            >
              <CheckIcon className="h-4 w-4" />
              Reactivate Account
            </button>
          ) : (
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg border border-red-200 px-3.5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <UserXIcon className="h-4 w-4" />
              Deactivate Account
            </button>
          )}
          <button
            type="button"
            disabled={user.status !== "Pending Invite"}
            className="flex w-full items-center gap-2.5 rounded-lg border border-black/15 px-3.5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-sage-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <MailIcon className="h-4 w-4" />
            Resend Invitation
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg border border-black/15 px-3.5 py-2.5 text-sm font-medium text-sky-700 hover:bg-sky-50"
          >
            <RefreshIcon className="h-4 w-4" />
            Transfer Handover
          </button>
        </div>
      </div>

      {user.recentActivity.length > 0 && (
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Recent Activity</h3>
            <Link href="/audit-logs" className="flex items-center gap-1 text-xs font-medium text-forest-700 hover:text-forest-800">
              View all
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
          <ul className="space-y-3">
            {user.recentActivity.map((entry) => (
              <li key={entry.timestamp + entry.description} className="flex gap-2.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-600" />
                <div className="min-w-0">
                  <p className="text-xs text-zinc-800">{entry.description}</p>
                  <p className="text-[11px] text-zinc-400">{entry.timestamp}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
