/** Developer controls for curator provisioning (REQ-4.2-02) and authorized access changes (REQ-4.2-03). */

"use client";

import { useActionState, useId } from "react";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import { onboardCuratorAction, updateCuratorStatusAction } from "@/features/developer/actions";
import {
  AUTHORIZATION_REASON_MAX_LENGTH,
  type CuratorStatusFormState,
  type OnboardFormState,
} from "@/features/developer/form";
import type { CuratorAccount } from "@/features/developer/types";

const inputClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:cursor-not-allowed disabled:bg-zinc-100";

const primaryButtonClasses =
  "rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

function FormMessage({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="mt-3 text-xs font-medium text-red-700">
      {message}
    </p>
  ) : null;
}

// ISO date only: deterministic on server and client, so it cannot cause a hydration mismatch.
function isoDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toISOString().slice(0, 10);
}

function OnboardCuratorForm({ hasActiveCurator }: { hasActiveCurator: boolean }) {
  const [state, action, pending] = useActionState<OnboardFormState, FormData>(onboardCuratorAction, {
    values: { email: "", fullName: "" },
  });

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5" aria-labelledby="onboard-heading">
      <h3 id="onboard-heading" className="text-sm font-semibold text-zinc-900">
        Provision curator account
      </h3>
      <p className="mt-1 text-xs text-zinc-600">
        Sends a secure password-setup invitation. The curator sets their own password; no password
        is ever entered here.
      </p>
      {hasActiveCurator && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          An active curator already exists. Only provision another account when the approved
          onboarding procedure authorizes it.
        </p>
      )}

      {/* key resets the uncontrolled inputs after a successful invite. */}
      <form key={state.success ?? "form"} action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-zinc-700">
          Full name
          <input
            name="fullName"
            defaultValue={state.values.fullName}
            required
            maxLength={255}
            autoComplete="off"
            className={inputClasses}
          />
        </label>
        <label className="text-xs font-medium text-zinc-700">
          Email address
          <input
            name="email"
            type="email"
            defaultValue={state.values.email}
            required
            autoComplete="off"
            className={inputClasses}
          />
        </label>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className={primaryButtonClasses}>
            Send invitation
          </button>
          <PendingOverlay pending={pending} label="Sending invitation…" />
          <FormMessage message={state.message} />
          {state.success && (
            <p role="status" className="mt-3 text-xs font-medium text-emerald-700">
              {state.success}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}

function StatusBadge({ status }: { status: CuratorAccount["status"] }) {
  return status === "ACTIVE" ? (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
      Inactive
    </span>
  );
}

function CuratorStatusControl({ curator }: { curator: CuratorAccount }) {
  const action = updateCuratorStatusAction.bind(null, curator.id);
  const [state, formAction, pending] = useActionState<CuratorStatusFormState, FormData>(action, {});
  const reasonId = useId();
  const deactivating = curator.status === "ACTIVE";

  return (
    <details className="group">
      <summary className="cursor-pointer text-xs font-semibold text-forest-800 hover:underline">
        {deactivating ? "Deactivate…" : "Activate…"}
      </summary>
      <form action={formAction} className="mt-2 w-full max-w-sm space-y-2">
        <input type="hidden" name="status" value={deactivating ? "INACTIVE" : "ACTIVE"} />
        <label htmlFor={reasonId} className="block text-xs font-medium text-zinc-700">
          Formal authorization (required)
        </label>
        <textarea
          id={reasonId}
          name="authorizationReason"
          // Not `required`: the confirm dialog makes the page inert, which would hide the
          // browser's validation bubble. The Server Action returns the message instead.
          aria-required="true"
          rows={3}
          maxLength={AUTHORIZATION_REASON_MAX_LENGTH}
          placeholder="e.g. Memo ref. no., authorizing official, and date"
          className={`${inputClasses} resize-y`}
        />
        <ConfirmButton
          label={deactivating ? "Deactivate account" : "Activate account"}
          question={deactivating ? `Deactivate ${curator.fullName}?` : `Activate ${curator.fullName}?`}
          detail={
            deactivating
              ? "This curator will no longer be able to sign in. The authorization note is recorded in the audit log."
              : "This curator will be able to sign in again. The authorization note is recorded in the audit log."
          }
          confirmLabel={deactivating ? "Yes, deactivate" : "Yes, activate"}
          tone={deactivating ? "danger" : "default"}
          pending={pending}
          pendingLabel="Updating account…"
          className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
            deactivating
              ? "border-red-200 text-red-700 hover:bg-red-50"
              : "border-forest-700 text-forest-800 hover:bg-forest-50"
          }`}
        />
        <FormMessage message={state.message} />
      </form>
    </details>
  );
}

export function CuratorAccountAdmin({ curators }: { curators: CuratorAccount[] | null }) {
  const hasActiveCurator = curators?.some((curator) => curator.status === "ACTIVE") ?? false;

  return (
    <section className="space-y-4" aria-labelledby="curator-admin-heading">
      <div>
        <h2 id="curator-admin-heading" className="font-serif text-lg font-semibold text-forest-800">
          Curator accounts
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Change access only when a formal authorization exists, and record it with the change.
        </p>
      </div>

      <OnboardCuratorForm hasActiveCurator={hasActiveCurator} />

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
        {curators === null ? (
          <p role="alert" className="p-5 text-sm text-red-700">
            Curator accounts could not be loaded. Reload the page or try again later.
          </p>
        ) : curators.length === 0 ? (
          <p className="p-5 text-sm text-zinc-600">No curator accounts exist yet. Provision the initial curator above.</p>
        ) : (
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-black/10 bg-sage-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Curator</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Created</th>
                <th scope="col" className="px-4 py-3 font-semibold">Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {curators.map((curator) => (
                <tr key={`${curator.id}-${curator.status}`} className="align-top">
                  <td className="px-4 py-3 font-medium text-zinc-900">{curator.fullName}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={curator.status} />
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{isoDate(curator.createdAt)}</td>
                  <td className="px-4 py-3">
                    <CuratorStatusControl curator={curator} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
