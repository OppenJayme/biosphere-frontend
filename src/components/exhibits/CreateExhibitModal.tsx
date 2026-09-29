/**
 * Creates an exhibit from an eligible specimen (REQ-4.12-01/02). New exhibits start unpublished;
 * images, AR, and publishing are handled on the exhibit afterwards.
 */

"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { CloseIcon, SearchIcon, LayersIcon, InfoIcon } from "@/components/icons";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import {
  createExhibitAction,
  searchEligibleSpecimensAction,
  type EligibleSpecimen,
} from "@/features/exhibits-qr/actions";
import { SLUG_MAX_LENGTH, suggestSlug, type ExhibitCreateValues, type ExhibitFormState } from "@/features/exhibits-qr/form";
import type { ExhibitListQuery } from "@/features/exhibits-qr/types";
import { ExhibitContentFields, FormMessage } from "./ExhibitParts";

const emptyValues: ExhibitCreateValues = {
  specimenId: "",
  publicSlug: "",
  publicDescription: "",
  interestingFacts: "",
  distribution: "",
  diet: "",
  layoutType: "mobile-accordion",
};

function specimenLabel(specimen: EligibleSpecimen) {
  return specimen.commonName ?? specimen.scientificName ?? specimen.accessionNumber ?? "Unnamed specimen";
}

function SpecimenPicker({
  selected,
  onSelect,
  error,
}: {
  selected: EligibleSpecimen | null;
  onSelect: (specimen: EligibleSpecimen | null) => void;
  error?: string;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<EligibleSpecimen[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searching, startSearch] = useTransition();

  useEffect(() => {
    if (selected) return;
    const timer = setTimeout(() => {
      startSearch(async () => {
        const result = await searchEligibleSpecimensAction(term);
        setResults(result.items);
        setMessage(result.message ?? null);
        setSearched(true);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [term, selected]);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-forest-50 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-forest-800">{specimenLabel(selected)}</p>
          <p className="truncate text-xs italic text-forest-700/70">{selected.scientificName ?? "—"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-xs font-medium text-zinc-500">{selected.accessionNumber ?? "No accession no."}</span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs font-semibold text-forest-700 underline hover:text-forest-800"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          maxLength={100}
          aria-label="Search eligible specimens"
          aria-invalid={error ? true : undefined}
          aria-describedby="specimen-picker-help"
          placeholder="Search by accession no., common name, or scientific name…"
          className="w-full rounded-lg border border-black/15 py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 aria-invalid:border-red-600"
        />
      </div>
      <p id="specimen-picker-help" className="mt-1.5 text-xs text-zinc-500">
        Only Cataloged specimens approved for public display that don&rsquo;t already have an exhibit are listed.
      </p>
      {error && <p className="mt-1 text-xs font-medium text-red-700">{error}</p>}
      <div aria-live="polite" className="mt-2">
        {message ? (
          <p role="alert" className="text-xs font-medium text-red-700">{message}</p>
        ) : results.length > 0 ? (
          <ul className="max-h-44 divide-y divide-black/5 overflow-y-auto rounded-lg border border-black/10">
            {results.map((specimen) => (
              <li key={specimen.id}>
                <button
                  type="button"
                  onClick={() => onSelect(specimen)}
                  className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-sage-50 focus-visible:bg-sage-50 focus-visible:outline-none"
                >
                  <span className="min-w-0 truncate">
                    <span className="font-medium text-zinc-900">{specimenLabel(specimen)}</span>{" "}
                    <span className="italic text-zinc-500">{specimen.scientificName}</span>
                  </span>
                  <span className="shrink-0 text-xs text-zinc-400">{specimen.accessionNumber}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : searching || !searched ? (
          <p className="text-xs text-zinc-500">Searching…</p>
        ) : (
          <p className="rounded-lg bg-sage-50 px-3 py-3 text-xs text-zinc-600">
            No eligible specimen matches. In Cataloging, a specimen must be Cataloged and approved for public
            display before it can have an exhibit.
          </p>
        )}
      </div>
    </div>
  );
}

function CreateExhibitForm({ query, onClose }: { query: ExhibitListQuery; onClose: () => void }) {
  const action = createExhibitAction.bind(null, query);
  const [state, formAction, pending] = useActionState<ExhibitFormState<ExhibitCreateValues>, FormData>(action, {
    values: emptyValues,
  });
  const [specimen, setSpecimen] = useState<EligibleSpecimen | null>(null);
  const [slug, setSlug] = useState(state.values.publicSlug);
  const [slugEdited, setSlugEdited] = useState(false);

  function selectSpecimen(next: EligibleSpecimen | null) {
    setSpecimen(next);
    if (next && !slugEdited) setSlug(suggestSlug(next.commonName ?? next.scientificName ?? ""));
  }

  return (
    <form action={formAction} className="flex max-h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-4">
        <div>
          <h2 id="create-exhibit-title" className="text-base font-semibold text-zinc-900">Create Exhibit</h2>
          <p className="text-xs text-zinc-500">A public QR page for one specimen. It starts unpublished.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-400 hover:text-zinc-600">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-5 overflow-y-auto px-6 py-5">
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Linked specimen</p>
          <SpecimenPicker selected={specimen} onSelect={selectSpecimen} error={state.errors?.specimenId} />
          <input type="hidden" name="specimenId" value={specimen?.id ?? ""} />
        </section>

        {specimen ? (
          <>
            <section>
              <label htmlFor="create-publicSlug" className="block text-xs font-medium text-zinc-700">
                Public URL ending
              </label>
              <span className="mt-1.5 flex items-center rounded-lg border border-black/15 bg-white focus-within:border-forest-700 focus-within:ring-1 focus-within:ring-forest-700 has-aria-invalid:border-red-600">
                <span className="pl-3 font-mono text-xs text-zinc-500">/exhibits/</span>
                <input
                  id="create-publicSlug"
                  name="publicSlug"
                  value={slug}
                  onChange={(event) => {
                    setSlug(event.target.value);
                    setSlugEdited(true);
                  }}
                  maxLength={SLUG_MAX_LENGTH}
                  required
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={state.errors?.publicSlug ? true : undefined}
                  aria-describedby="create-publicSlug-help"
                  className="w-full rounded-r-lg bg-transparent py-2 pr-3 font-mono text-sm text-zinc-900 focus:outline-none"
                />
              </span>
              <p id="create-publicSlug-help" className={`mt-1 text-xs ${state.errors?.publicSlug ? "font-medium text-red-700" : "text-zinc-500"}`}>
                {state.errors?.publicSlug ??
                  "This goes into the QR code, so choose it carefully: changing it later breaks printed labels."}
              </p>
            </section>

            <section>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Public content</p>
              <p className="mb-4 flex gap-2 rounded-lg bg-sage-50 px-3 py-2 text-xs text-zinc-600">
                <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                Name, taxonomy, habitat, ecological role, and conservation status are shown from the specimen
                record. Blank fields below are hidden on the public page.
              </p>
              <ExhibitContentFields idPrefix="create" values={state.values} errors={state.errors} />
            </section>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <LayersIcon className="h-8 w-8 text-zinc-300" />
            <p className="text-sm font-semibold text-zinc-700">Link a specimen to continue</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-6 py-4">
        <div className="min-w-0 flex-1">
          <FormMessage message={state.message} />
          {!state.message && (
            <p className="text-xs text-zinc-500">Add images and publish from the exhibit after it is created.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!specimen || pending}
            className="rounded-lg bg-forest-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create exhibit
          </button>
        </div>
      </div>
      <PendingOverlay pending={pending} label="Creating exhibit…" />
    </form>
  );
}

export function CreateExhibitModal({
  open,
  onClose,
  query,
}: {
  open: boolean;
  onClose: () => void;
  query: ExhibitListQuery;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="create-exhibit-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl rounded-xl border border-black/10 bg-white p-0 text-left text-zinc-900 shadow-xl backdrop:bg-forest-900/50 backdrop:backdrop-blur-sm"
    >
      {/* Mounted only while open, so each opening starts from a clean form. */}
      {open && <CreateExhibitForm query={query} onClose={onClose} />}
    </dialog>
  );
}

