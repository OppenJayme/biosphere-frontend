/**
 * Cataloging controls for public eligibility and archive-not-delete behavior.
 * Active lot information is display-only; inventory resolution remains outside this module.
 */

"use client";

import { useActionState } from "react";
import {
  archiveSpecimenAction,
  setSpecimenPublicDisplayAction,
  type LifecycleActionState,
} from "@/features/specimens/lifecycle-actions";
import { archiveBlockReason, publicDisplayCommand } from "@/features/specimens/lifecycle";
import type { SpecimenSummary } from "@/features/specimens/types";

type SpecimenLifecyclePanelProps = {
  specimen: SpecimenSummary;
  activeLotCount: number;
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
            : "Only a Cataloged specimen can be marked publicly eligible. Catalog completion remains unavailable until the museum approves its required-field rules."}
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
      <form
        action={formAction}
        className="mt-3"
        onSubmit={(event) => {
          if (!window.confirm(command.confirmation)) event.preventDefault();
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-forest-700 px-3 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving..." : command.label}
        </button>
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
        Archiving preserves history and disables public eligibility. There is no restore workflow
        yet, so verify the record before continuing.
      </p>
      {blockedReason ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
          {blockedReason}
        </div>
      ) : (
        <form
          action={formAction}
          className="mt-3"
          onSubmit={(event) => {
            if (!window.confirm("Archive this specimen record? This preserves its history but there is currently no restore workflow.")) {
              event.preventDefault();
            }
          }}
        >
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Archiving..." : "Archive specimen"}
          </button>
        </form>
      )}
      {state.message && <p role="alert" className="mt-2 text-xs text-red-700">{state.message}</p>}
    </div>
  );
}

export function SpecimenLifecyclePanel({
  specimen,
  activeLotCount,
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
        <ArchiveControl specimen={specimen} activeLotCount={activeLotCount} />
      </div>
    </section>
  );
}
