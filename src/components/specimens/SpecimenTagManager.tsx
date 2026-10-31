/**
 * Interactive Cataloging UI for attaching, changing, and detaching reusable specimen tags.
 * It never renames/deletes shared vocabulary and does not manage inventory or storage.
 */

"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import {
  attachSpecimenTagAction,
  changeSpecimenTagAction,
  detachSpecimenTagAction,
} from "@/features/specimens/tag-actions";
import type { DetachTagState, TagFormState } from "@/features/specimens/tag-form";
import type { SpecimenTag } from "@/features/specimens/types";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";

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
      {/* Detaching preserves vocabulary/history but still asks first to avoid mistakes. */}
      <form action={formAction}>
        <ConfirmButton
          label="Detach"
          confirmLabel="Yes, detach"
          question={`Detach “${tag.name}”?`}
          detail="The tag stays in the shared vocabulary."
          tone="danger"
          pending={pending}
          pendingLabel="Detaching tag…"
          className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </form>
      {state.message && (
        <p role="alert" className="mt-1 max-w-72 text-xs text-red-700">
          {state.message}
        </p>
      )}
    </div>
  );
}

/**
 * One attached tag. "Change" swaps this specimen's tag for another name (e.g. Mindanao ->
 * Visayas) without renaming the shared tag on other specimens.
 */
function TagRow({
  specimenId,
  tag,
  readOnly,
}: {
  specimenId: string;
  tag: SpecimenTag;
  readOnly: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const action = changeSpecimenTagAction.bind(null, specimenId, { id: tag.id, name: tag.name });
  const [state, formAction, pending] = useActionState<TagFormState, FormData>(action, {
    values: { tagName: tag.name },
  });
  const errorId = `change-tag-${tag.id}-error`;
  const error = state.errors?.tagName?.[0] ?? state.message;

  if (editing && !readOnly) {
    return (
      <li className="py-3 first:pt-0 last:pb-0">
        <form action={formAction} className="flex flex-wrap items-end gap-2">
          <label className="min-w-56 flex-1 text-xs font-medium text-zinc-700">
            Change “{tag.name}” to
            <input
              type="text"
              name="tagName"
              list="available-specimen-tags"
              defaultValue={state.values.tagName}
              maxLength={100}
              required
              autoFocus
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
              onKeyDown={(event) => {
                if (event.key === "Escape") setEditing(false);
              }}
              className={inputClasses}
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save
          </button>
          <PendingOverlay pending={pending} label="Changing tag…" />
          <button
            type="button"
            disabled={pending}
            onClick={() => setEditing(false)}
            className="rounded-lg border border-black/15 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
        </form>
        {error && (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-red-700">
            {error}
          </p>
        )}
        <p className="mt-1.5 text-xs text-zinc-500">
          Only this specimen changes. Other specimens tagged “{tag.name}” keep it.
        </p>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <span className="rounded-full bg-sage-100 px-3 py-1.5 text-sm font-medium text-forest-800">
        {tag.name}
      </span>
      {!readOnly && (
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-forest-700 px-2.5 py-1 text-xs font-semibold text-forest-800 hover:bg-forest-50"
          >
            Change
          </button>
          <DetachTagControl specimenId={specimenId} tag={tag} />
        </div>
      )}
    </li>
  );
}

/** Visible, keyboard-accessible vocabulary choices; selecting never saves a tag. */
export function ReusableTagSuggestions({
  tags,
  pending,
  onSelect,
}: {
  tags: SpecimenTag[];
  pending: boolean;
  onSelect: (name: string) => void;
}) {
  return (
    <div className="mt-3">
      <p role="status" className="text-xs text-zinc-500">
        {tags.length === 0
          ? "No reusable tags match this search. You can still enter a new approved name above."
          : `${tags.length} reusable tag suggestion${tags.length === 1 ? "" : "s"}. Choose a name, then click Attach tag to save.`}
      </p>
      {tags.length > 0 && (
        <ul aria-label="Reusable tag suggestions" className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => onSelect(tag.name)}
                className="rounded-full border border-forest-700 px-3 py-2 text-sm font-medium text-forest-800 enabled:hover:bg-forest-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {tag.name}
              </button>
            </li>
          ))}
        </ul>
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
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState<TagFormState, FormData>(
    attachAction,
    { values: { tagName: "" } },
  );

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-black/10 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Attached tags</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Tags describe catalog information and reuse a shared curator-managed vocabulary.
        </p>

        {currentTags.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">No tags are attached to this specimen.</p>
        ) : (
          <ul className="mt-4 divide-y divide-black/5">
            {currentTags.map((tag) => (
              <TagRow key={tag.id} specimenId={specimenId} tag={tag} readOnly={readOnly} />
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
          <h2 className="text-base font-semibold text-zinc-900">Attach a tag</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Select an existing suggestion or enter a new curator-approved tag name.
          </p>

          <form action={formAction} className="mt-4 flex flex-wrap items-start gap-3">
            <label className="min-w-64 flex-1 text-xs font-medium text-zinc-700">
              Tag name
              <input
                ref={tagInputRef}
                type="text"
                name="tagName"
                list="available-specimen-tags"
                defaultValue={state.values.tagName}
                maxLength={100}
                required
                disabled={pending}
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
              Attach tag
            </button>
            <PendingOverlay pending={pending} label="Attaching tag…" />
          </form>

          {state.message && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {state.message}
            </p>
          )}

          <div className="mt-6 border-t border-black/5 pt-4">
            <form key={search} action={`/specimens/${specimenId}/tags`} className="flex flex-wrap items-end gap-2">
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
            <ReusableTagSuggestions
              tags={availableTags}
              pending={pending}
              onSelect={(name) => {
                // Keep the native uncontrolled form/reset behavior; the existing action saves.
                if (pending || !tagInputRef.current) return;
                tagInputRef.current.value = name;
                tagInputRef.current.focus();
              }}
            />
          </div>
        </section>
      )}
    </div>
  );
}
