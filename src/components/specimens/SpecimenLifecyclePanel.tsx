/**
 * Cataloging controls for public eligibility, archival, and revalidated restoration.
 * Active lot information is display-only; inventory resolution remains outside this module.
 */

"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { InfoTip } from "@/components/ui/InfoTip";
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
        <p className="text-sm font-semibold text-zinc-900">Public display</p>
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
      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        Public display
        <InfoTip label="Public display">
          An eligible specimen can be used for a public QR exhibit. Turning this on does not publish anything by
          itself, and the internal catalog record is never shown to visitors.
        </InfoTip>
      </p>
      <p className="mt-1.5">
        <Badge tone={specimen.publicDisplay ? "success" : "neutral"}>
          {specimen.publicDisplay ? "Eligible for public display" : "Not eligible for public display"}
        </Badge>
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
      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        Archive record
        <InfoTip label="Archiving">
          The record and its history are kept, but it leaves the active catalog and public display is turned off.
          You can restore it later; it is then checked against the current cataloging requirements.
        </InfoTip>
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
      <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        Restore archived record
        <InfoTip label="Restoring">
          The record comes back as Cataloged only if it meets every current requirement, otherwise as Uncataloged.
          Public display stays off. Lots, quantities and storage are not changed.
        </InfoTip>
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
      <h2 className="mb-4 text-base font-semibold text-zinc-900">Public display and archive</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <PublicDisplayControl specimen={specimen} />
        {specimen.status === "ARCHIVED"
          ? <RestoreControl specimen={specimen} readiness={readiness} />
          : <ArchiveControl specimen={specimen} activeLotCount={activeLotCount} />}
      </div>
    </section>
  );
}
