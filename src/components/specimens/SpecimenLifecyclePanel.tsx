/**
 * Cataloging controls for public eligibility, archival, and revalidated restoration.
 * Active lot information is display-only; inventory resolution remains outside this module.
 */

"use client";

import { useActionState } from "react";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import {
  archiveSpecimenAction,
  restoreSpecimenAction,
  setSpecimenPublicDisplayAction,
  type LifecycleActionState,
} from "@/features/specimens/lifecycle-actions";
import { archiveBlockReason, publicDisplayCommand } from "@/features/specimens/lifecycle";
import type { CatalogReadiness, SpecimenSummary } from "@/features/specimens/types";

type SpecimenLifecyclePanelProps = {
  specimen: SpecimenSummary;
  activeLotCount: number;
  readiness?: CatalogReadiness | null;
};

function PublicDisplayControl({ specimen }: { specimen: SpecimenSummary }) {
  const command = publicDisplayCommand(specimen);
  const action = setSpecimenPublicDisplayAction.bind(
    null,
    specimen.id,
    command?.nextValue ?? false,
  );
  const [state, formAction, pending] = useActionState<LifecycleActionState, FormData>(
    action,
    {},
  );

  if (!command) {
    return (
      <div>
        <p className="text-sm font-semibold text-zinc-900">Public-display eligibility</p>
        <p className="mt-1 text-sm text-zinc-600">
          {specimen.status === "ARCHIVED"
            ? "Archived specimens cannot be publicly eligible."
            : "Only a Cataloged specimen can be marked publicly eligible. Catalog this specimen first."}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-zinc-900">Public-display eligibility</p>
      <p className="mt-1 text-sm text-zinc-600">
        Currently {specimen.publicDisplay ? "eligible" : "not eligible"}. Eligibility does not
        publish an exhibit or expose the internal catalog record.
      </p>
      <form action={formAction} className="mt-3">
        <ConfirmButton
          label={command.label}
          question={command.question}
          confirmLabel={command.confirmLabel}
          detail={command.detail}
          pending={pending}
          pendingLabel="Updating public eligibility…"
          className="rounded-lg border border-forest-700 px-3 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </form>
      {state.message && <p role="alert" className="mt-2 text-xs text-red-700">{state.message}</p>}
    </div>
  );
}

function ArchiveControl({ specimen, activeLotCount }: SpecimenLifecyclePanelProps) {
  const blockedReason = archiveBlockReason(specimen.status, activeLotCount);
  const action = archiveSpecimenAction.bind(null, specimen.id);
  const [state, formAction, pending] = useActionState<LifecycleActionState, FormData>(
    action,
    {},
  );

  return (
    <div className="border-t border-black/5 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
      <p className="text-sm font-semibold text-zinc-900">Archive record</p>
      <p className="mt-1 text-sm text-zinc-600">
        Archiving preserves history and disables public eligibility. Restoring later revalidates
        the record against current Cataloging requirements.
      </p>
      {blockedReason ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
          {blockedReason}
        </div>
      ) : (
        <form action={formAction} className="mt-3">
          <ConfirmButton
            label="Archive specimen"
            question="Archive this specimen?"
            confirmLabel="Yes, archive"
            detail="History is preserved and public eligibility is disabled. Active inventory must be resolved separately."
            tone="danger"
            pending={pending}
            pendingLabel="Archiving specimen…"
            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </form>
      )}
      {state.message && <p role="alert" className="mt-2 text-xs text-red-700">{state.message}</p>}
    </div>
  );
}

/** The preview is advisory: restoration rechecks the same requirements inside its transaction. */
function RestoreControl({ specimen, readiness }: Pick<SpecimenLifecyclePanelProps, "specimen" | "readiness">) {
  const [state, formAction, pending] = useActionState<LifecycleActionState, FormData>(
    restoreSpecimenAction.bind(null, specimen.id),
    {},
  );

  return (
    <div className="border-t border-black/5 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
      <p className="text-sm font-semibold text-zinc-900">Restore archived record</p>
      <p className="mt-1 text-sm text-zinc-600">
        Restores this same record as Cataloged only if every current requirement passes;
        otherwise as Uncataloged. Public display stays off. Lots, quantities, and storage are not changed.
      </p>
      {readiness ? (
        <div className="mt-3 rounded-lg border border-black/10 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-700">
          <p>{readiness.requirementsMet
            ? "Currently meets all requirements: would restore as Cataloged."
            : "Would currently restore as Uncataloged. Missing requirements:"}</p>
          {readiness.missingRequirements.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {readiness.missingRequirements.map((label) => <li key={label}>{label}</li>)}
            </ul>
          )}
          <p className="mt-2">Requirements are checked again when you confirm.</p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-amber-900">
          The readiness preview is unavailable. The backend will still revalidate before restoring.
        </p>
      )}
      <form action={formAction} className="mt-3">
        <ConfirmButton
          label="Restore specimen"
          question="Restore this specimen?"
          confirmLabel="Yes, restore"
          detail="Current requirements determine Cataloged or Uncataloged status. Public display stays off; inventory and original history are preserved."
          pending={pending}
          pendingLabel="Restoring specimen…"
          className="rounded-lg border border-forest-700 px-3 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </form>
      {state.message && <p role="alert" className="mt-2 text-xs text-red-700">{state.message}</p>}
    </div>
  );
}

export function SpecimenLifecyclePanel({
  specimen,
  activeLotCount,
  readiness,
}: SpecimenLifecyclePanelProps) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-5">
      <div className="mb-4">
        <h2 className="font-serif text-lg font-semibold text-forest-800">Catalog lifecycle</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Controlled record-state operations; physical inventory is managed separately.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <PublicDisplayControl specimen={specimen} />
        {specimen.status === "ARCHIVED"
          ? <RestoreControl specimen={specimen} readiness={readiness} />
          : <ArchiveControl specimen={specimen} activeLotCount={activeLotCount} />}
      </div>
    </section>
  );
}
