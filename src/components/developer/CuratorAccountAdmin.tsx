/**
 * Developer controls for curator provisioning (REQ-4.2-02), authorized access changes
 * (REQ-4.2-03) and curator handover (REQ-4.1-09), laid out as dashboard panels: the invite
 * and handover forms open in modals, and each account's access change opens from its row.
 *
 * Forms inside a modal keep errors inline (a toast would sit behind the backdrop) and on
 * success show a toast and close the modal through reportActionDone.
 */

"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/dashboard/Panel";
import { SearchIcon } from "@/components/icons";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { FilterChips } from "@/components/ui/FilterChips";
import { ModalButton } from "@/components/ui/ModalButton";
import { TablePagination } from "@/components/ui/TablePagination";
import { notify, reportActionDone, useResultToast } from "@/components/ui/toast";
import {
  handOverCuratorAction,
  onboardCuratorAction,
  resendCuratorInviteAction,
  updateCuratorStatusAction,
} from "@/features/developer/actions";
import {
  AUTHORIZATION_REASON_MAX_LENGTH,
  type CuratorHandoverFormState,
  type CuratorStatusFormState,
  type OnboardFormState,
  type ResendInviteFormState,
} from "@/features/developer/form";
import type { CuratorAccount } from "@/features/developer/types";

const inputClasses =
  "mt-1 w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:cursor-not-allowed disabled:bg-zinc-100";

const primaryButtonClasses =
  "rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClasses =
  "rounded-lg border border-black/15 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-sage-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700 disabled:cursor-not-allowed disabled:opacity-60";

const CURATOR_PAGE_SIZES = [5, 10, 25] as const;

type CuratorState = "active" | "pending" | "inactive";
type CuratorFilter = "all" | CuratorState;

/** An invited curator stays ACTIVE until they set a password, so "pending" is shown separately. */
function curatorState(curator: CuratorAccount): CuratorState {
  if (curator.status !== "ACTIVE") return "inactive";
  return curator.inviteAccepted ? "active" : "pending";
}

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

/**
 * Toasts a modal form's success and closes the modal. `succeeded` decides from a new state;
 * the first (initial) state is skipped.
 */
function useModalSuccess<S>(state: S, succeeded: (state: S) => string | null) {
  const initial = useRef(state);
  useEffect(() => {
    if (state === initial.current) return;
    const message = succeeded(state);
    if (!message) return;
    notify("success", message);
    reportActionDone();
    // `succeeded` is a pure mapping supplied inline; only a new state should trigger this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
}

function OnboardCuratorForm({ hasActiveCurator }: { hasActiveCurator: boolean }) {
  const [state, action, pending] = useActionState<OnboardFormState, FormData>(onboardCuratorAction, {
    values: { email: "", fullName: "" },
  });
  useModalSuccess(state, (next) => next.success ?? null);

  return (
    <>
      {hasActiveCurator && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          An active curator already exists. Only provision another account when the approved onboarding
          procedure authorizes it.
        </p>
      )}
      {/* key resets the uncontrolled inputs after a successful invite. */}
      <form key={state.success ?? "form"} action={action} className="grid gap-3 sm:grid-cols-2">
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
          <ConfirmButton
            label="Send invitation"
            question="Send this invitation?"
            detail="An invitation email with a password-setup link is sent to the address you entered."
            confirmLabel="Send invitation"
            pending={pending}
            pendingLabel="Sending invitation…"
            className={primaryButtonClasses}
          />
          <FormMessage message={state.message} />
        </div>
      </form>
    </>
  );
}

/** Page-header button that opens the curator invitation form. */
export function InviteCuratorButton({ curators }: { curators: CuratorAccount[] | null }) {
  const hasActiveCurator = curators?.some((curator) => curatorState(curator) === "active") ?? false;
  return (
    <ModalButton
      label="Invite curator"
      title="Invite a curator"
      description="Sends a secure password-setup invitation. The curator sets their own password; no password is ever entered here."
      className={primaryButtonClasses}
    >
      <OnboardCuratorForm hasActiveCurator={hasActiveCurator} />
    </ModalButton>
  );
}

function StatusBadge({ curator }: { curator: CuratorAccount }) {
  const state = curatorState(curator);
  if (state === "pending") {
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
        Pending invite
      </span>
    );
  }
  return state === "active" ? (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
      Inactive
    </span>
  );
}

/** Emails a new password-setup link while the invitation is still pending. */
function ResendInviteControl({ curator }: { curator: CuratorAccount }) {
  const [state, formAction, pending] = useActionState<ResendInviteFormState, FormData>(
    resendCuratorInviteAction.bind(null, curator.id),
    {},
  );
  useResultToast(state);

  return (
    <form action={formAction}>
      <ConfirmButton
        label="Resend invite"
        question="Resend this invitation?"
        detail="A new password-setup link is emailed to this curator."
        confirmLabel="Resend invitation"
        pending={pending}
        pendingLabel="Sending…"
        className={secondaryButtonClasses}
      />
    </form>
  );
}

function CuratorStatusForm({ curator }: { curator: CuratorAccount }) {
  const action = updateCuratorStatusAction.bind(null, curator.id);
  const [state, formAction, pending] = useActionState<CuratorStatusFormState, FormData>(action, {});
  const reasonId = useId();
  const deactivating = curator.status === "ACTIVE";
  // The action returns an empty state on success and a message on failure.
  useModalSuccess(state, (next) =>
    next.message ? null : deactivating ? `${curator.fullName} was deactivated.` : `${curator.fullName} was activated.`,
  );

  return (
    <form action={formAction} className="space-y-2">
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
        className={
          deactivating
            ? "rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            : primaryButtonClasses
        }
      />
      <FormMessage message={state.message} />
    </form>
  );
}

function CuratorStatusControl({
  curator,
  onOpenChange,
}: {
  curator: CuratorAccount;
  onOpenChange: (open: boolean) => void;
}) {
  const deactivating = curator.status === "ACTIVE";
  return (
    <ModalButton
      label={deactivating ? "Deactivate" : "Activate"}
      title={deactivating ? `Deactivate ${curator.fullName}` : `Activate ${curator.fullName}`}
      description="Change access only when a formal authorization exists. It is recorded with the change."
      onOpenChange={onOpenChange}
      className={
        deactivating
          ? "rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          : secondaryButtonClasses
      }
    >
      <CuratorStatusForm curator={curator} />
    </ModalButton>
  );
}

/** Searchable, filterable list of curator accounts with each row's access actions. */
export function CuratorAccountsPanel({ curators }: { curators: CuratorAccount[] | null }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CuratorFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(CURATOR_PAGE_SIZES[0]);
  // The curator whose access modal is open stays listed until it closes, even when the
  // change moves them out of the current filter; unmounting the row would lose the result.
  const [openId, setOpenId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const result = { all: 0, active: 0, pending: 0, inactive: 0 };
    for (const curator of curators ?? []) {
      result.all += 1;
      result[curatorState(curator)] += 1;
    }
    return result;
  }, [curators]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (curators ?? []).filter(
      (curator) =>
        curator.id === openId ||
        ((filter === "all" || curatorState(curator) === filter) &&
          (!needle || curator.fullName.toLowerCase().includes(needle))),
    );
  }, [curators, filter, query, openId]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function chooseFilter(next: CuratorFilter) {
    setFilter(next);
    setPage(1);
  }

  return (
    <Panel
      title="Curator accounts"
      info="Change access only when a formal authorization exists, and record it with the change. Every change is written to the audit log."
    >
      {curators === null ? (
        <p role="alert" className="text-sm text-red-700">
          Curator accounts could not be loaded. Reload the page or try again later.
        </p>
      ) : curators.length === 0 ? (
        <p className="text-sm text-zinc-600">No curator accounts exist yet. Use Invite curator to provision the first one.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <label className="relative block">
              <span className="sr-only">Search curators by name</span>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name"
                className="w-full rounded-lg border border-black/15 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
              />
            </label>
            <FilterChips
              label="Filter curators by status"
              chips={[
                { label: "All", count: counts.all, active: filter === "all", onClick: () => chooseFilter("all") },
                { label: "Active", count: counts.active, active: filter === "active", onClick: () => chooseFilter("active") },
                { label: "Pending invite", count: counts.pending, active: filter === "pending", onClick: () => chooseFilter("pending") },
                { label: "Inactive", count: counts.inactive, active: filter === "inactive", onClick: () => chooseFilter("inactive") },
              ]}
            />
          </div>

          {rows.length === 0 ? (
            <p className="mt-4 rounded-lg bg-sage-50 px-3 py-6 text-center text-sm text-zinc-600">
              No curators match this search.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="border-b border-black/10 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-semibold">Curator</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Status</th>
                    <th scope="col" className="px-3 py-2 font-semibold">Created</th>
                    <th scope="col" className="py-2 pl-3 text-right font-semibold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {rows.map((curator) => (
                    // Keyed by id only: the status form must stay mounted to see its result,
                    // toast it and close its modal (React resets the form fields itself).
                    <tr key={curator.id}>
                      <td className="max-w-56 truncate py-2.5 pr-3 font-medium text-zinc-900" title={curator.fullName}>
                        {curator.fullName}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge curator={curator} />
                      </td>
                      <td className="px-3 py-2.5 text-zinc-600 tabular-nums">{isoDate(curator.createdAt)}</td>
                      <td className="py-2.5 pl-3">
                        <div className="flex justify-end gap-2">
                          {curatorState(curator) === "pending" && <ResendInviteControl curator={curator} />}
                          <CuratorStatusControl
                            curator={curator}
                            onOpenChange={(open) =>
                              setOpenId((current) => (open ? curator.id : current === curator.id ? null : current))
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <TablePagination
              className="mt-3"
              label="Curator account pages"
              noun="curators"
              sizes={CURATOR_PAGE_SIZES}
              page={currentPage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          )}
        </>
      )}
    </Panel>
  );
}

/**
 * Curator handover (REQ-4.1-09). The museum decided on 2026-11-07 that curators do not
 * deactivate each other, so the Developer records it. The lists only narrow the choice;
 * the backend checks that the successor has accepted their invitation and signed in.
 */
function CuratorHandoverForm({ curators }: { curators: CuratorAccount[] }) {
  const [state, action, pending] = useActionState<CuratorHandoverFormState, FormData>(handOverCuratorAction, {});
  useModalSuccess(state, (next) => next.success ?? null);
  const reasonId = useId();
  const outgoing = curators.filter((curator) => curator.status === "ACTIVE");
  const successors = curators.filter((curator) => curatorState(curator) === "active");

  return (
    // key resets the form after a successful handover.
    <form key={state.success ?? "handover"} action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-medium text-zinc-700">
        Curator who is leaving
        <select name="outgoingCuratorId" defaultValue="" aria-required="true" className={inputClasses}>
          <option value="" disabled>
            Choose a curator
          </option>
          {outgoing.map((curator) => (
            <option key={curator.id} value={curator.id}>
              {curator.fullName}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-zinc-700">
        Successor
        <select name="successorCuratorId" defaultValue="" aria-required="true" className={inputClasses}>
          <option value="" disabled>
            Choose the successor
          </option>
          {successors.map((curator) => (
            <option key={curator.id} value={curator.id}>
              {curator.fullName}
            </option>
          ))}
        </select>
      </label>
      <div className="sm:col-span-2">
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
          placeholder="e.g. Retirement memo ref. no., authorizing official, and date"
          className={`${inputClasses} resize-y`}
        />
      </div>
      <div className="sm:col-span-2">
        <ConfirmButton
          label="Record handover"
          question="Record this curator handover?"
          detail="The leaving curator will no longer be able to sign in. Their account is kept, and the authorization note is recorded in the audit log."
          confirmLabel="Yes, hand over"
          tone="danger"
          pending={pending}
          pendingLabel="Recording handover…"
          className={primaryButtonClasses}
        />
        <FormMessage message={state.message} />
      </div>
    </form>
  );
}

/** Side card: explains the handover and opens its form once two accepted curators exist. */
export function CuratorHandoverPanel({ curators }: { curators: CuratorAccount[] | null }) {
  const accepted = (curators ?? []).filter((curator) => curatorState(curator) === "active").length;
  const ready = accepted > 1;

  return (
    <Panel title="Curator handover">
      <p className="text-xs leading-relaxed text-zinc-600">
        Use this when a curator leaves. Invite the successor first, and wait until they have set their password and
        signed in. The leaving curator&apos;s account is then turned off and kept, so its history stays on record.
      </p>
      {ready && curators ? (
        <div className="mt-4">
          <ModalButton
            label="Start handover"
            title="Curator handover"
            description="No password is passed between people. The authorization is recorded in the audit log."
            className={secondaryButtonClasses}
          >
            <CuratorHandoverForm curators={curators} />
          </ModalButton>
        </div>
      ) : (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          A handover needs two active curators who have both accepted their invitations.
        </p>
      )}
    </Panel>
  );
}
