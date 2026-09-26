/**
 * Catalog-completion control for an Uncataloged specimen: shows which required fields are
 * still missing (grouped by the section that edits them) and submits the catalog transition.
 * The backend re-validates on submit, so a stale "ready" state can never catalog incomplete data.
 */

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import {
  catalogSpecimenAction,
  type CatalogActionState,
} from "@/features/specimens/lifecycle-actions";
import { groupMissingCatalogFields } from "@/features/specimens/lifecycle";
import type { CatalogReadiness } from "@/features/specimens/types";

type SpecimenCatalogPanelProps = {
  specimenId: string;
  /** Null when readiness could not be loaded; the backend still guards the transition. */
  readiness: CatalogReadiness | null;
};

export function SpecimenCatalogPanel({ specimenId, readiness }: SpecimenCatalogPanelProps) {
  const action = catalogSpecimenAction.bind(null, specimenId);
  const [state, formAction, pending] = useActionState<CatalogActionState, FormData>(action, {});

  // A rejection from submit time is fresher than the readiness read at page load.
  const missingFields = state.missingFields ?? readiness?.missingFields ?? [];
  const groups = groupMissingCatalogFields(specimenId, missingFields);
  const blocked = groups.length > 0;

  return (
    <section
      aria-labelledby="catalog-specimen-heading"
      className="rounded-xl border border-black/10 bg-white p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h2 id="catalog-specimen-heading" className="font-serif text-lg font-semibold text-forest-800">
            Catalog specimen
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            {blocked
              ? "Complete the required fields below before this record can move from Uncataloged to Cataloged. Images are not required."
              : readiness
                ? "Every required field is filled. Cataloging makes the record eligible for public display."
                : "Catalog readiness could not be checked. You can still try; the backend verifies every required field."}
          </p>
        </div>

        <form action={formAction}>
          <ConfirmButton
            label="Catalog specimen"
            question="Catalog this specimen?"
            confirmLabel="Yes, catalog"
            detail="The record moves from Uncataloged to Cataloged."
            pending={pending}
            pendingLabel="Cataloging specimen…"
            disabled={blocked}
            describedBy={blocked ? "catalog-missing-heading" : undefined}
            className="rounded-lg bg-forest-700 px-4 py-2 text-xs font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
          />
        </form>
      </div>

      {state.message && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {blocked && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p id="catalog-missing-heading" className="text-sm font-semibold text-amber-950">
            Missing before cataloging
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                  {group.href ? (
                    <Link href={group.href} className="hover:underline">
                      {group.title} →
                    </Link>
                  ) : (
                    group.title
                  )}
                </p>
                <ul className="mt-1.5 space-y-1 text-sm text-amber-950">
                  {group.labels.map((label) => (
                    <li key={label}>{label}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
