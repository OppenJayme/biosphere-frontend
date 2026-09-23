/**
 * Collection maintenance UI for Cataloging: bounded search, create, and rename.
 * It intentionally exposes no delete/archive control until a lifecycle rule is approved.
 */

"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createCollectionAction,
  renameCollectionAction,
} from "@/features/specimens/collection-actions";
import {
  collectionListHref,
  type CollectionFormState,
  type CollectionListQuery,
} from "@/features/specimens/collection-management";
import type { CollectionPage, MuseumCollection } from "@/features/specimens/types";

const inputClasses =
  "w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:cursor-not-allowed disabled:bg-zinc-100";

function CollectionCreateForm() {
  const [state, action, pending] = useActionState<CollectionFormState, FormData>(
    createCollectionAction,
    { value: "" },
  );

  return (
    <form action={action} className="rounded-xl border border-black/10 bg-white p-5">
      <h2 className="font-serif text-lg font-semibold text-forest-800">Add collection</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Add a curator-approved collection name for assignment to specimen records.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <label htmlFor="new-collection-name" className="sr-only">Collection name</label>
          <input
            id="new-collection-name"
            name="collectionName"
            defaultValue={state.value}
            required
            maxLength={255}
            aria-invalid={Boolean(state.error)}
            aria-describedby={state.error ? "new-collection-error" : undefined}
            placeholder="Collection name"
            className={inputClasses}
          />
          {state.error && (
            <p id="new-collection-error" role="alert" className="mt-1 text-xs font-medium text-red-700">
              {state.error}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Adding..." : "Add collection"}
        </button>
      </div>
    </form>
  );
}

function CollectionRenameForm({ collection }: { collection: MuseumCollection }) {
  const action = renameCollectionAction.bind(null, collection.id);
  const [state, formAction, pending] = useActionState<CollectionFormState, FormData>(
    action,
    { value: collection.collectionName },
  );
  const errorId = `collection-${collection.id}-error`;

  return (
    <form action={formAction} className="flex min-w-[20rem] items-start gap-2">
      <div className="min-w-0 flex-1">
        <label htmlFor={`collection-${collection.id}`} className="sr-only">
          Rename {collection.collectionName}
        </label>
        <input
          id={`collection-${collection.id}`}
          name="collectionName"
          defaultValue={state.value}
          required
          maxLength={255}
          aria-invalid={Boolean(state.error)}
          aria-describedby={state.error ? errorId : undefined}
          className={inputClasses}
        />
        {state.error && (
          <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-700">
            {state.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-forest-700 px-3 py-2.5 text-xs font-semibold text-forest-800 hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving..." : "Rename"}
      </button>
    </form>
  );
}

export function CollectionManager({
  page,
  query,
}: {
  page: CollectionPage;
  query: CollectionListQuery;
}) {
  const first = page.total === 0 ? 0 : (page.page - 1) * page.limit + 1;
  const last = Math.min(page.page * page.limit, page.total);
  const hasPrevious = page.page > 1;
  const hasNext = page.page * page.limit < page.total;

  return (
    <div className="space-y-5">
      <CollectionCreateForm />

      <section className="overflow-hidden rounded-xl border border-black/10 bg-white">
        <div className="border-b border-black/10 p-4">
          <form action="/specimens/collections" className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="collection-search" className="sr-only">Search collections</label>
            <input
              id="collection-search"
              type="search"
              name="search"
              defaultValue={query.search}
              maxLength={100}
              placeholder="Search collection names"
              className={`${inputClasses} sm:max-w-md`}
            />
            <button
              type="submit"
              className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
            >
              Search
            </button>
            {query.search && (
              <Link
                href="/specimens/collections"
                className="rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-forest-800 hover:bg-forest-50"
              >
                Clear
              </Link>
            )}
          </form>
        </div>

        {page.items.length === 0 ? (
          <div className="p-6 text-sm text-zinc-600">
            {query.search
              ? "No collections match this search. Existing records were not changed."
              : "No collections have been added yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="bg-sage-50 text-xs font-semibold uppercase tracking-wide text-zinc-600">
                <tr>
                  <th scope="col" className="px-4 py-3">Collection</th>
                  <th scope="col" className="px-4 py-3">Rename</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {page.items.map((collection) => (
                  <tr key={collection.id}>
                    <td className="px-4 py-4 align-top font-medium text-zinc-900">
                      {collection.collectionName}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <CollectionRenameForm collection={collection} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-4 py-3 text-sm text-zinc-600">
          <p>{page.total === 0 ? "0 collections" : `${first}-${last} of ${page.total} collections`}</p>
          <div className="flex gap-2">
            {hasPrevious ? (
              <Link
                href={collectionListHref(query, page.page - 1)}
                className="rounded-lg border border-black/15 px-3 py-2 font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-lg border border-black/10 px-3 py-2 text-zinc-400">Previous</span>
            )}
            {hasNext ? (
              <Link
                href={collectionListHref(query, page.page + 1)}
                className="rounded-lg border border-black/15 px-3 py-2 font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-lg border border-black/10 px-3 py-2 text-zinc-400">Next</span>
            )}
          </div>
        </div>
      </section>

      <p className="text-xs text-zinc-500">
        Collections cannot be deleted or archived yet because that lifecycle rule and its database
        support have not been approved. Renaming preserves specimen relationships through the
        collection UUID.
      </p>
    </div>
  );
}
