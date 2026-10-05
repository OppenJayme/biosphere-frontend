"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ClockIcon, CalendarIcon, ShieldIcon, CheckIcon, ArrowRightIcon, MailIcon, InfoIcon } from "@/components/icons";
import { getUserRecentActivity } from "@/features/user-accounts/actions";
import type { AccountUser, RecentActivityResult } from "@/features/user-accounts/types";
import { ROLE_STYLES, STATUS_STYLES } from "./UserTable";

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

function RecentActivity({ accountId }: { accountId: string }) {
  const [result, setResult] = useState<RecentActivityResult | null>(null);

  useEffect(() => {
    // Ignore a slow response that arrives after this panel was unmounted.
    let cancelled = false;
    getUserRecentActivity(accountId)
      .then((value) => {
        if (!cancelled) setResult(value);
      })
      .catch(() => {
        if (!cancelled) setResult({ status: "error", message: "Recent activity is unavailable right now." });
      });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Recent Activity</h3>
        <Link href="/audit-logs" className="flex items-center gap-1 text-xs font-medium text-forest-700 hover:text-forest-800">
          View all
          <ArrowRightIcon className="h-3 w-3" />
        </Link>
      </div>
      {!result ? (
        <p className="py-3 text-center text-xs text-zinc-500" aria-live="polite">
          Loading activity…
        </p>
      ) : result.status === "error" ? (
        <p className="py-3 text-center text-xs text-red-600" role="alert">
          {result.message}
        </p>
      ) : result.items.length === 0 ? (
        <p className="py-3 text-center text-xs text-zinc-500">No recorded activity yet.</p>
      ) : (
        <ul className="space-y-3">
          {result.items.map((entry) => (
            <li key={entry.id} className="flex gap-2.5">
              <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${entry.failed ? "bg-red-500" : "bg-forest-600"}`} />
              <div className="min-w-0">
                <p className="text-xs text-zinc-800">
                  {entry.description}
                  {entry.failed && <span className="ml-1 text-red-600">(failed)</span>}
                </p>
                <p className="text-[11px] text-zinc-400">{entry.timestamp}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function UserDetailPanel({ user }: { user: AccountUser | null }) {
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
            <p className="truncate text-sm font-semibold text-zinc-900">
              {user.name}
              {user.isCurrentUser && <span className="ml-1.5 text-xs font-normal text-zinc-500">(you)</span>}
            </p>
            <p className="truncate text-xs text-zinc-500">{user.email ?? "No email on record"}</p>
          </div>
        </div>

        <div className="mt-3 divide-y divide-black/5 border-t border-black/5">
          <InfoRow icon={ShieldIcon} label="Role">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_STYLES[user.role]}`}>{user.role}</span>
          </InfoRow>
          <InfoRow icon={CheckIcon} label="Status">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[user.status]}`}>{user.status}</span>
          </InfoRow>
          <InfoRow icon={MailIcon} label="Email">
            {user.email ?? "—"}
          </InfoRow>
          <InfoRow icon={ClockIcon} label="Last Sign-in">
            {user.lastSignIn ?? "Never signed in"}
          </InfoRow>
          <InfoRow icon={CalendarIcon} label="Created On">
            {user.createdOnFull}
          </InfoRow>
        </div>

        <p className="mt-3 flex gap-1.5 rounded-lg bg-sage-50 p-2.5 text-[11px] leading-relaxed text-zinc-600">
          <InfoIcon className="mt-px h-3.5 w-3.5 shrink-0" />
          Inviting curators, activating or deactivating accounts, and handover aren&rsquo;t available here yet.
        </p>
      </div>

      {/* Keyed so switching users starts a fresh load instead of showing the previous user's activity. */}
      <RecentActivity key={user.id} accountId={user.id} />
    </div>
  );
}
