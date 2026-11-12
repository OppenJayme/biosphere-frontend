"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { ClockIcon, CalendarIcon, ShieldIcon, CheckIcon, ArrowRightIcon, MailIcon, InfoIcon } from "@/components/icons";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import { getUserRecentActivity, resendInvitationAction } from "@/features/user-accounts/actions";
import type { ResendInvitationState } from "@/features/user-accounts/form";
import type { AccountUser, RecentActivityResult } from "@/features/user-accounts/types";
import { STATUS_STYLES } from "./UserTable";

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
    <div className="rounded-xl border border-black/10 bg-white p-5">
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
                {/* The sentence already says when an action failed or was denied. */}
                <p className="text-xs text-zinc-800">{entry.description}</p>
                <p className="text-[0.6875rem] text-zinc-500">{entry.timestamp}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Emails a new password-setup link while the invitation is still pending, e.g. after the first one expired. */
function ResendInvitation({ user }: { user: AccountUser }) {
  const [state, formAction, pending] = useActionState<ResendInvitationState, FormData>(
    resendInvitationAction.bind(null, user.id),
    {},
  );

  return (
    <form action={formAction} className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <p className="text-[0.6875rem] leading-relaxed text-amber-950">
        This curator has not set a password yet. If their link expired or got lost, send a new one. Earlier
        links stop working.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-forest-700 bg-white px-3 py-1.5 text-xs font-semibold text-forest-800 hover:bg-forest-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MailIcon className="h-3.5 w-3.5" />
        Resend invitation
      </button>
      <PendingOverlay pending={pending} label="Sending invitation…" />
      {state.message && (
        <p role="alert" className="mt-2 text-xs font-medium text-red-700">
          {state.message}
        </p>
      )}
      {state.success && (
        <p role="status" className="mt-2 text-xs font-medium text-emerald-700">
          {state.success}
        </p>
      )}
    </form>
  );
}

export function UserDetailPanel({ user }: { user: AccountUser | null }) {
  if (!user) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">Selected User</h3>
        <p className="py-6 text-center text-xs text-zinc-500">
          Select a user from the table to see their details here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-black/10 bg-white p-5">
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
            Curator
          </InfoRow>
          <InfoRow icon={CheckIcon} label="Status">
            <span className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${STATUS_STYLES[user.status]}`}>{user.status}</span>
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

        {/* Keyed so a message about one user never shows on another. */}
        {user.status === "Pending Invite" && <ResendInvitation key={user.id} user={user} />}

        {/* The museum decided on 2026-11-07 that curators do not deactivate each other
            (REQ-4.1-08); an account is turned off through a Developer handover (REQ-4.1-09). */}
        <p className="mt-3 flex gap-1.5 rounded-lg bg-sage-50 p-2.5 text-[0.6875rem] leading-relaxed text-zinc-600">
          <InfoIcon className="mt-px h-3.5 w-3.5 shrink-0" />
          Curators cannot turn off curator accounts. When a curator leaves, the system developer hands the
          account over to their successor.
        </p>
      </div>

      {/* Keyed so switching users starts a fresh load instead of showing the previous user's activity. */}
      <RecentActivity key={user.id} accountId={user.id} />
    </div>
  );
}
