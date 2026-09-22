/**
 * Interactive Cataloging UI for attaching and detaching reusable specimen tags.
 * It never renames/deletes shared vocabulary and does not manage inventory or storage.
 */

"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  attachSpecimenTagAction,
  detachSpecimenTagAction,
} from "@/features/specimens/tag-actions";
import type { DetachTagState, TagFormState } from "@/features/specimens/tag-form";
import type { SpecimenTag } from "@/features/specimens/types";

type SpecimenTagManagerProps = {
  specimenId: string;
  currentTags: SpecimenTag[];
  availableTags: SpecimenTag[];
  search: string;
  readOnly: boolean;
};

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";

function DetachTagControl({ specimenId, tag }: { specimenId: string; tag: SpecimenTag }) {
  const action = detachSpecimenTagAction.bind(null, specimenId, tag.id);
  const [state, formAction, pending] = useActionState<DetachTagState, FormData>(
    action,
    {},
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(event) => {
          // Detaching preserves vocabulary/history but still requires confirmation to avoid mistakes.
          if (!window.confirm(`Detach the tag “${tag.name}” from this specimen?`)) {
            event.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Removing..." : "Detach"}
        </button>
      </form>
      {state.message && (
        <p role="alert" className="mt-1 max-w-72 text-xs text-red-700">
          {state.message}
        </p>
      )}
    </div>
  );
}

export function SpecimenTagManager({
  specimenId,
  currentTags,
  availableTags,
  search,
  readOnly,
}: SpecimenTagManagerProps) {
  const attachAction = attachSpecimenTagAction.bind(null, specimenId);
  const [state, formAction, pending] = useActionState<TagFormState, FormData>(
    attachAction,
    { values: { tagName: "" } },
  );

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="font-serif text-lg font-semibold text-forest-800">Attached tags</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Tags describe catalog information and reuse a shared curator-managed vocabulary.
        </p>

        {currentTags.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No tags are attached to this specimen.</p>
        ) : (
          <ul className="mt-4 divide-y divide-black/5">
            {currentTags.map((tag) => (
              <li key={tag.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="rounded-full bg-sage-100 px-3 py-1.5 text-sm font-medium text-forest-800">
                  {tag.name}
                </span>
                {!readOnly && <DetachTagControl specimenId={specimenId} tag={tag} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      {readOnly ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
          Tags for archived specimen records are read-only and cannot be changed.
        </div>
      ) : (
        <section className="rounded-xl border border-black/10 bg-white p-5">
          <h2 className="font-serif text-lg font-semibold text-forest-800">Attach a tag</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Select an existing suggestion or enter a new curator-approved tag name.
          </p>

          <form action={formAction} className="mt-4 flex flex-wrap items-start gap-3">
            <label className="min-w-64 flex-1 text-xs font-medium text-zinc-700">
              Tag name
              <input
                type="text"
                name="tagName"
                list="available-specimen-tags"
                defaultValue={state.values.tagName}
                maxLength={100}
                required
                placeholder="Example: Endemic"
                aria-invalid={Boolean(state.errors?.tagName?.length)}
                aria-describedby={state.errors?.tagName?.length ? "tagName-error" : undefined}
                className={inputClasses}
              />
              <datalist id="available-specimen-tags">
                {availableTags.map((tag) => (
                  <option key={tag.id} value={tag.name} />
                ))}
              </datalist>
              {state.errors?.tagName?.length && (
                <p id="tagName-error" className="mt-1 text-xs font-medium text-red-700">
                  {state.errors.tagName[0]}
                </p>
              )}
            </label>
            <button
              type="submit"
              disabled={pending}
              className="mt-5 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Attaching..." : "Attach tag"}
            </button>
          </form>

          {state.message && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {state.message}
            </p>
          )}

          <div className="mt-6 border-t border-black/5 pt-4">
            <form action={`/specimens/${specimenId}/tags`} className="flex flex-wrap items-end gap-2">
              <label className="min-w-56 flex-1 text-xs font-medium text-zinc-700">
                Search reusable vocabulary
                <input
                  type="search"
                  name="search"
                  defaultValue={search}
                  maxLength={100}
                  placeholder="Filter existing tags"
                  className={inputClasses}
                />
              </label>
              <button
                type="submit"
                className="rounded-lg border border-forest-700 px-4 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50"
              >
                Search
              </button>
              {search && (
                <Link
                  href={`/specimens/${specimenId}/tags`}
                  className="px-3 py-2.5 text-sm font-semibold text-forest-800 hover:underline"
                >
                  Clear
                </Link>
              )}
            </form>
            <p className="mt-3 text-xs text-zinc-500">
              {availableTags.length === 0
                ? "No reusable tags match this search. You can still enter a new approved name above."
                : `${availableTags.length} reusable tag suggestion${availableTags.length === 1 ? "" : "s"} available in the tag-name field.`}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
