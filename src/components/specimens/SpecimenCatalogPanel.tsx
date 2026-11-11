/**
 * Catalog-completion controls. Uncataloged: the backend's readiness checks (pass/fail, each
 * failed one linked to its edit page) and the complete-cataloging action. Cataloged: an
 * audited "Reopen cataloging" action that needs a reason.
 * The backend re-validates every rule, so a stale page can never catalog incomplete data.
 */

"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import {
  catalogSpecimenAction,
  reopenCatalogingAction,
  type CatalogActionState,
  type ReopenActionState,
} from "@/features/specimens/lifecycle-actions";
import { catalogCheckHref, REOPEN_REASON_MAX } from "@/features/specimens/lifecycle";
import type { CatalogReadiness, SpecimenStatus } from "@/features/specimens/types";
import { InfoTip } from "@/components/ui/InfoTip";

type SpecimenCatalogPanelProps = {
  specimenId: string;
  status: SpecimenStatus;
  /** Null when readiness could not be loaded; the backend still guards the transition. */
  readiness: CatalogReadiness | null;
};

export function SpecimenCatalogPanel({ specimenId, status, readiness }: SpecimenCatalogPanelProps) {
  if (status === "ARCHIVED") return null;

  return (
    <section
      aria-labelledby="catalog-specimen-heading"
      className="rounded-xl border border-black/10 bg-white p-5"
    >
      {status === "CATALOGED" ? (
        <ReopenCataloging specimenId={specimenId} />
      ) : (
        <CompleteCataloging specimenId={specimenId} readiness={readiness} />
      )}
    </section>
  );
}

function CompleteCataloging({
  specimenId,
  readiness,
}: {
  specimenId: string;
  readiness: CatalogReadiness | null;
}) {
  const action = catalogSpecimenAction.bind(null, specimenId);
  const [state, formAction, pending] = useActionState<CatalogActionState, FormData>(action, {});
  const blocked = readiness ? !readiness.canComplete : false;
  // A rejection from submit time is fresher than the readiness read at page load.
  const rejected = state.missingRequirements;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 id="catalog-specimen-heading" className="flex items-center gap-2 text-base font-semibold text-zinc-900">
            Catalog this specimen
            <InfoTip label="Cataloging" align="start">
              Cataloging marks the record as complete. Only cataloged specimens can be made eligible for public
              display.
            </InfoTip>
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {!readiness
              ? "The checklist could not be loaded. You can still try; every requirement is checked when you confirm."
              : readiness.canComplete
                ? "Everything required is filled in. You can catalog this specimen now."
                : "Finish the items marked below first."}
          </p>
        </div>

        <form action={formAction}>
          <ConfirmButton
            label="Catalog specimen"
            question="Catalog this specimen?"
            confirmLabel="Yes, catalog"
            detail="The record moves from Uncataloged to Cataloged. Public display stays off until you turn it on."
            pending={pending}
            pendingLabel="Cataloging specimen…"
            disabled={blocked}
            describedBy={blocked ? "catalog-requirements-heading" : undefined}
            className="rounded-lg bg-forest-700 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
          />
        </form>
      </div>

      {state.message && (
        <div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-medium">{state.message}</p>
          {rejected && (
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5">
              {rejected.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {readiness && readiness.checks.length > 0 && (
        <div className="mt-4">
          <p id="catalog-requirements-heading" className="text-sm font-medium text-zinc-700">
            Checklist
          </p>
          <ul className="mt-2 divide-y divide-black/5 rounded-lg border border-black/10">
            {readiness.checks.map((check) => {
              const href = check.passed ? null : catalogCheckHref(specimenId, check.key);
              return (
                <li key={check.key} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                  <span
                    aria-hidden
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.6875rem] font-bold ${
                      check.passed ? "bg-forest-100 text-forest-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {check.passed ? "✓" : "!"}
                  </span>
                  <span className={`min-w-0 flex-1 ${check.passed ? "text-zinc-700" : "font-medium text-amber-950"}`}>
                    {check.label}
                    <span className="sr-only">{check.passed ? " (met)" : " (missing)"}</span>
                  </span>
                  {href && (
                    <Link href={href} className="shrink-0 text-xs font-semibold text-forest-800 hover:underline">
                      Fix →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

function ReopenCataloging({ specimenId }: { specimenId: string }) {
  const action = reopenCatalogingAction.bind(null, specimenId);
  const [state, formAction, pending] = useActionState<ReopenActionState, FormData>(action, {});
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const reasonId = useId();
  const errorId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function cancel() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 id="catalog-specimen-heading" className="flex items-center gap-2 text-base font-semibold text-zinc-900">
            This specimen is cataloged
            <InfoTip label="Cataloged records" align="start">
              Required fields can&apos;t be emptied while a record is cataloged. To correct one, reopen cataloging; the
              reason you give is kept in the revision and audit history.
            </InfoTip>
          </h2>
        </div>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-forest-700 px-4 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50"
        >
          Reopen cataloging
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          if (!pending) cancel();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && !pending) cancel();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-black/10 bg-white p-0 text-left text-zinc-900 shadow-[0_24px_60px_-20px_rgb(20_42_31/0.45)] backdrop:bg-forest-900/50 backdrop:backdrop-blur-sm motion-safe:open:animate-[confirm-in_160ms_ease-out]"
      >
        {open && (
          <form action={formAction} className="p-6">
            <h2 id={titleId} className="font-serif text-xl font-semibold text-forest-900">
              Reopen cataloging?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600">
              The record returns to Uncataloged and public display is turned off.
            </p>

            <label htmlFor={reasonId} className="mt-4 block text-xs font-medium text-zinc-700">
              Reason (required)
            </label>
            <textarea
              id={reasonId}
              name="reason"
              rows={3}
              required
              autoFocus
              maxLength={REOPEN_REASON_MAX}
              defaultValue={state.values?.reason}
              placeholder="Example: Correcting the collection date after re-examining the label."
              aria-invalid={Boolean(state.message)}
              aria-describedby={state.message ? errorId : undefined}
              className="mt-1.5 w-full rounded-lg border border-black/15 px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
            />
            {state.message && (
              <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-700">
                {state.message}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancel}
                disabled={pending}
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-60"
              >
                Reopen cataloging
              </button>
            </div>
            <PendingOverlay pending={pending} label="Reopening cataloging…" />
          </form>
        )}
      </dialog>
    </>
  );
}
