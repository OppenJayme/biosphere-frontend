"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, fieldClasses } from "@/components/ui/Field";
import {
  CloseIcon,
  SearchIcon,
  InfoIcon,
  ImageIcon,
  GridIcon,
  ListIcon,
  UploadIcon,
  StarIcon,
  TrashIcon,
  LockIcon,
} from "@/components/icons";
import {
  createExhibitAction,
  loadExhibitMediaAction,
  removeExhibitMediaAction,
  searchEligibleSpecimensAction,
  updateExhibitAction,
  type CreateExhibitState,
  type EligibleSpecimen,
  type ExhibitMediaResult,
} from "@/features/exhibits-qr/actions";
import {
  EXHIBIT_MEDIA_ACCEPT,
  exhibitImageError,
  suggestSlug,
  type ExhibitEditValues,
  type ExhibitFormState,
} from "@/features/exhibits-qr/form";
import { exhibitDisplayName, exhibitLayout, type ExhibitLayout, type ExhibitRow } from "@/features/exhibits-qr/types";

type Tab = "Public Content" | "Images";

function ShowBadge({ value }: { value: string }) {
  return value.trim() ? (
    <span className="rounded-full bg-forest-100 px-2 py-0.5 text-[11px] font-medium text-forest-700">Will show</span>
  ) : (
    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">Hidden</span>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

function LayoutOption({
  active,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof GridIcon;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex-1 rounded-lg border p-4 text-left transition-colors ${
        active ? "border-forest-700 bg-forest-50" : "border-black/15 hover:bg-sage-50"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <Icon className="h-4 w-4 text-forest-700" />
        {title}
      </span>
      <span className="mt-1 block text-xs text-zinc-500">{description}</span>
      {active && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-forest-700 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-3 w-3">
            <path d="m5 13 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
    </button>
  );
}

function specimenLabel(specimen: EligibleSpecimen) {
  return specimen.commonName ?? specimen.scientificName ?? specimen.accessionNumber ?? "Unnamed specimen";
}

/** Searches Cataloged, public-display specimens that do not already have an exhibit. */
function SpecimenPicker({
  selected,
  onSelect,
  error,
}: {
  selected: EligibleSpecimen | null;
  onSelect: (specimen: EligibleSpecimen | null) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EligibleSpecimen[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selected) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      searchEligibleSpecimensAction(query).then((result) => {
        if (cancelled) return;
        setResults(result.items);
        setMessage(result.message ?? null);
        setLoading(false);
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, selected]);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-forest-50 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-forest-800">{specimenLabel(selected)}</p>
          {selected.scientificName && (
            <p className="truncate text-xs italic text-forest-700/70">{selected.scientificName}</p>
          )}
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
    <>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search eligible specimens"
          placeholder="Search by accession no., common name, or scientific name..."
          className="w-full rounded-lg border border-black/15 py-2.5 pl-10 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
        />
      </div>
      <p className="mt-1.5 text-xs text-zinc-500">
        Only Cataloged specimens approved for public display, without an existing exhibit, are listed.
      </p>
      <FieldError message={error} />
      <div className="mt-2 max-h-40 divide-y divide-black/5 overflow-y-auto rounded-lg border border-black/10">
        {loading ? (
          <p className="px-3.5 py-3 text-xs text-zinc-500">Searching…</p>
        ) : message ? (
          <p className="px-3.5 py-3 text-xs text-red-600">{message}</p>
        ) : results.length === 0 ? (
          <p className="px-3.5 py-3 text-xs text-zinc-500">No eligible specimens found.</p>
        ) : (
          results.map((specimen) => (
            <button
              key={specimen.id}
              type="button"
              onClick={() => onSelect(specimen)}
              className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-sage-50"
            >
              <span>
                <span className="font-medium text-zinc-900">{specimenLabel(specimen)}</span>{" "}
                {specimen.scientificName && <span className="italic text-zinc-500">{specimen.scientificName}</span>}
              </span>
              <span className="shrink-0 text-xs text-zinc-400">{specimen.accessionNumber}</span>
            </button>
          ))
        )}
      </div>
    </>
  );
}

function mediaName(item: { mediaUrl: string; caption: string | null }) {
  return item.caption ?? item.mediaUrl.split("/").pop() ?? "Image";
}

async function uploadMessage(response: Response) {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "message" in body && typeof body.message === "string") return body.message;
  } catch {
    // Fall through to the generic message.
  }
  return "The image could not be uploaded. Check your connection and try again.";
}

/** Upload and removal for an existing exhibit. The backend has no caption/order/cover edits. */
function ImagesTab({ exhibit }: { exhibit: ExhibitRow }) {
  const router = useRouter();
  const [media, setMedia] = useState<ExhibitMediaResult | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removing, startRemove] = useTransition();
  const [reloadKey, setReloadKey] = useState(0);
  // Plain inputs, not a nested <form>: this tab renders inside the exhibit form.
  const fileRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    loadExhibitMediaAction(exhibit.id).then((result) => {
      if (!cancelled) setMedia(result);
    });
    return () => {
      cancelled = true;
    };
  }, [exhibit.id, reloadKey]);

  async function upload() {
    if (uploading) return;
    const file = fileRef.current?.files?.[0];
    const fileError = exhibitImageError(file);
    if (fileError || !file) {
      setNotice({ ok: false, message: fileError ?? "Choose a non-empty image file." });
      return;
    }
    const data = new FormData();
    data.set("file", file);
    data.set("caption", captionRef.current?.value ?? "");
    data.set("displayOrder", String(media?.media.length ?? 0));
    data.set("isCover", coverRef.current?.checked ? "true" : "false");

    setUploading(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/exhibits/${exhibit.id}/media`, { method: "POST", body: data });
      if (!response.ok) {
        setNotice({ ok: false, message: await uploadMessage(response) });
        return;
      }
      if (fileRef.current) fileRef.current.value = "";
      if (captionRef.current) captionRef.current.value = "";
      if (coverRef.current) coverRef.current.checked = false;
      setNotice({ ok: true, message: "Image uploaded." });
      setReloadKey((key) => key + 1);
      router.refresh();
    } catch {
      setNotice({ ok: false, message: "The image could not be uploaded. Check your connection and try again." });
    } finally {
      setUploading(false);
    }
  }

  function remove(mediaId: string) {
    startRemove(async () => {
      const result = await removeExhibitMediaAction(exhibit.id, mediaId, exhibit.publicSlug);
      setNotice({ ok: Boolean(result.ok), message: result.message ?? "The image could not be removed." });
      setConfirmId(null);
      if (result.ok) setReloadKey((key) => key + 1);
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-black/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Upload Image</p>
        <input
          ref={fileRef}
          type="file"
          accept={EXHIBIT_MEDIA_ACCEPT}
          aria-label="Image file"
          className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-sage-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-forest-800"
        />
        <input ref={captionRef} maxLength={255} placeholder="Caption (optional)" aria-label="Caption" className={fieldClasses} />
        <label className="flex items-center gap-2 text-xs text-zinc-700">
          <input ref={coverRef} type="checkbox" className="accent-forest-700" />
          Use as cover photo
        </label>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-500">JPEG, PNG, or WebP, up to 15 MB.</p>
          <button
            type="button"
            onClick={upload}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-sage-100 disabled:opacity-50"
          >
            <UploadIcon className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>

      {notice && (
        <p role={notice.ok ? "status" : "alert"} className={`text-xs ${notice.ok ? "text-forest-700" : "text-red-600"}`}>
          {notice.message}
        </p>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Exhibit Photos</p>
        {!media ? (
          <p className="text-xs text-zinc-500">Loading images…</p>
        ) : media.message ? (
          <p className="text-xs text-red-600">{media.message}</p>
        ) : media.media.length === 0 ? (
          <p className="text-xs text-zinc-500">No images yet.</p>
        ) : (
          <div className="space-y-2">
            {media.media.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg border border-black/10 px-3.5 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sage-100 text-forest-700">
                  <ImageIcon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">{mediaName(item)}</span>
                {item.isCover && (
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-[11px] font-medium text-gold-700">
                    <StarIcon className="h-3 w-3" />
                    Cover photo
                  </span>
                )}
                {confirmId === item.id ? (
                  <span className="flex shrink-0 items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      disabled={removing}
                      onClick={() => remove(item.id)}
                      className="font-semibold text-red-600 hover:underline disabled:opacity-50"
                    >
                      {removing ? "Removing…" : "Remove"}
                    </button>
                    <button type="button" onClick={() => setConfirmId(null)} className="text-zinc-500 hover:underline">
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(item.id)}
                    aria-label={`Remove ${mediaName(item)}`}
                    className="shrink-0 text-zinc-400 hover:text-red-600"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-zinc-500">
          The cover photo appears first in the public carousel. Images are previewable once the exhibit is published.
        </p>
      </div>
    </div>
  );
}

const EMPTY_CREATE: CreateExhibitState = {
  values: {
    specimenId: "",
    publicSlug: "",
    publicDescription: "",
    interestingFacts: "",
    distribution: "",
    diet: "",
    layoutType: "mobile-accordion",
  },
};

export function CreateExhibitModal({
  exhibit,
  onClose,
  onSaved,
}: {
  /** The exhibit to edit; null to create a new one. */
  exhibit: ExhibitRow | null;
  onClose: () => void;
  onSaved: (exhibitId: string, message: string) => void;
}) {
  const editing = exhibit !== null;
  const initialLayout: ExhibitLayout = exhibit ? exhibitLayout(exhibit.layoutType) : "mobile-accordion";

  const [specimen, setSpecimen] = useState<EligibleSpecimen | null>(null);
  const [slug, setSlug] = useState(exhibit?.publicSlug ?? "");
  const [slugEdited, setSlugEdited] = useState(editing);
  const [layout, setLayout] = useState<ExhibitLayout>(initialLayout);
  const [tab, setTab] = useState<Tab>("Public Content");
  const [description, setDescription] = useState(exhibit?.publicDescription ?? "");
  const [distribution, setDistribution] = useState(exhibit?.distribution ?? "");
  const [diet, setDiet] = useState(exhibit?.diet ?? "");
  const [facts, setFacts] = useState(exhibit?.interestingFacts ?? "");

  const [createState, createAction, creating] = useActionState(createExhibitAction, EMPTY_CREATE);
  const [updateState, updateAction, updating] = useActionState<ExhibitFormState<ExhibitEditValues>, FormData>(
    exhibit ? updateExhibitAction.bind(null, exhibit.id, exhibit.publicSlug) : async (state) => state,
    { values: { publicSlug: "", publicDescription: "", interestingFacts: "", distribution: "", diet: "", layoutType: "" } },
  );
  const state = editing ? updateState : createState;
  const pending = creating || updating;
  const errors: Partial<Record<string, string>> = state.errors ?? {};

  // Hand a successful save back to the workspace once, per action result.
  const handled = useRef<unknown>(null);
  useEffect(() => {
    if (!state.ok || handled.current === state) return;
    handled.current = state;
    const id = exhibit?.id ?? createState.exhibitId;
    if (id) onSaved(id, state.message ?? "Exhibit saved.");
  }, [state, exhibit, createState.exhibitId, onSaved]);

  function selectSpecimen(next: EligibleSpecimen | null) {
    setSpecimen(next);
    if (next && !slugEdited) setSlug(suggestSlug(specimenLabel(next)));
  }

  const slugChanged = editing && slug.trim() !== exhibit.publicSlug;
  const canSave = editing || specimen !== null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8 sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="exhibit-modal-title" className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <form action={editing ? updateAction : createAction}>
          <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-4">
            <div>
              <h2 id="exhibit-modal-title" className="text-base font-semibold text-zinc-900">
                {editing ? `Edit ${exhibitDisplayName(exhibit)}` : "Create Exhibit"}
              </h2>
              <p className="text-xs text-zinc-500">Public-facing exhibit content</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="text-zinc-400 hover:text-zinc-600">
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Linked Specimen</p>
            {editing ? (
              <div className="flex items-center justify-between gap-3 rounded-lg bg-sage-50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-800">{exhibitDisplayName(exhibit)}</p>
                  {exhibit.specimen?.scientificName && (
                    <p className="truncate text-xs italic text-zinc-500">{exhibit.specimen.scientificName}</p>
                  )}
                </div>
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-zinc-400">
                  <LockIcon className="h-3 w-3" />
                  {exhibit.specimen?.accessionNumber ?? "Cannot be changed"}
                </span>
              </div>
            ) : (
              <SpecimenPicker selected={specimen} onSelect={selectSpecimen} error={errors.specimenId} />
            )}
            <input type="hidden" name="specimenId" value={specimen?.id ?? ""} />

            <div className="mt-5">
              <Field label="Public URL ending" htmlFor="publicSlug">
                <div className="flex items-center rounded-lg border border-black/15 focus-within:border-forest-700 focus-within:ring-1 focus-within:ring-forest-700">
                  <span className="pl-3 text-sm text-zinc-400">/exhibits/</span>
                  <input
                    id="publicSlug"
                    name="publicSlug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugEdited(true);
                    }}
                    placeholder="e.g. giant-forest-beetle"
                    className="w-full rounded-r-lg py-2.5 pr-3 text-sm text-zinc-900 focus:outline-none"
                  />
                </div>
              </Field>
              <FieldError message={errors.publicSlug} />
              {slugChanged && (
                <p className="mt-1.5 text-xs text-amber-700">
                  Changing the URL breaks any QR labels already printed for /exhibits/{exhibit.publicSlug}.
                </p>
              )}
              {editing && <input type="hidden" name="originalSlug" value={exhibit.publicSlug} />}
            </div>

            <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">Public Page Layout</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <LayoutOption
                active={layout === "card-grid"}
                onClick={() => setLayout("card-grid")}
                icon={GridIcon}
                title="Card Grid"
                description="Hero image, description panel, and detail cards."
              />
              <LayoutOption
                active={layout === "mobile-accordion"}
                onClick={() => setLayout("mobile-accordion")}
                icon={ListIcon}
                title="Mobile Accordion"
                description="Compact hero with collapsible sections."
              />
            </div>
            <input type="hidden" name="layoutType" value={layout} />
            {editing && <input type="hidden" name="originalLayout" value={initialLayout} />}
            <FieldError message={errors.layoutType} />

            <div className="mt-5 flex gap-5 overflow-x-auto border-b border-black/10">
              {(["Public Content", "Images"] as const).map((t) => {
                const Icon = t === "Images" ? ImageIcon : InfoIcon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`flex shrink-0 items-center gap-1.5 border-b-2 py-3 text-sm font-medium whitespace-nowrap ${
                      tab === t ? "border-forest-700 text-forest-800" : "border-transparent text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t}
                  </button>
                );
              })}
            </div>

            <div className="pt-5">
              {/* Content fields stay mounted (hidden) on the Images tab so the form still submits them. */}
              <div className={tab === "Public Content" ? "space-y-5" : "hidden"}>
                <Field label="Public Description" htmlFor="publicDescription">
                  <div className="mb-1 flex justify-end"><ShowBadge value={description} /></div>
                  <textarea
                    id="publicDescription"
                    name="publicDescription"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What visitors will read about this specimen"
                    className={`${fieldClasses} mt-0 resize-none`}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Field label="Distribution" htmlFor="distribution">
                      <div className="mb-1 flex justify-end"><ShowBadge value={distribution} /></div>
                      <input
                        id="distribution"
                        name="distribution"
                        maxLength={255}
                        value={distribution}
                        onChange={(e) => setDistribution(e.target.value)}
                        placeholder="e.g. Mindanao, Philippines"
                        className={`${fieldClasses} mt-0`}
                      />
                    </Field>
                    <FieldError message={errors.distribution} />
                  </div>
                  <div>
                    <Field label="Diet" htmlFor="diet">
                      <div className="mb-1 flex justify-end"><ShowBadge value={diet} /></div>
                      <input
                        id="diet"
                        name="diet"
                        maxLength={255}
                        value={diet}
                        onChange={(e) => setDiet(e.target.value)}
                        placeholder="e.g. Sap, Fruits"
                        className={`${fieldClasses} mt-0`}
                      />
                    </Field>
                    <FieldError message={errors.diet} />
                  </div>
                </div>

                <Field label="Interesting Facts" htmlFor="interestingFacts">
                  <div className="mb-1 flex justify-end"><ShowBadge value={facts} /></div>
                  <textarea
                    id="interestingFacts"
                    name="interestingFacts"
                    rows={3}
                    value={facts}
                    onChange={(e) => setFacts(e.target.value)}
                    placeholder="One fact per line"
                    className={`${fieldClasses} mt-0 resize-none`}
                  />
                  <p className="mt-1.5 text-xs text-zinc-500">Leave blank to hide this section entirely.</p>
                </Field>
              </div>

              {tab === "Images" &&
                (editing ? (
                  <ImagesTab exhibit={exhibit} />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <ImageIcon className="h-8 w-8 text-zinc-300" />
                    <p className="text-sm font-semibold text-zinc-700">Save the exhibit first</p>
                    <p className="max-w-xs text-xs text-zinc-500">
                      Images can be uploaded from Edit Exhibit once the exhibit has been created.
                    </p>
                  </div>
                ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 px-6 py-4">
            <p role={state.message && !state.ok ? "alert" : undefined} className={`text-xs ${state.message && !state.ok ? "text-red-600" : "text-zinc-500"}`}>
              {state.message && !state.ok
                ? state.message
                : canSave
                  ? "Fields left blank won't appear on the public exhibit page."
                  : "Link a specimen to enable saving."}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-black/15 px-3.5 py-2 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
              >
                Cancel
              </button>
              {editing ? (
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-forest-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {pending ? "Saving…" : "Save Changes"}
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    name="intent"
                    value="draft"
                    disabled={!canSave || pending}
                    className="rounded-lg border border-forest-700 px-3.5 py-2 text-sm font-semibold text-forest-700 hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {pending ? "Saving…" : "Save as Unpublished"}
                  </button>
                  <button
                    type="submit"
                    name="intent"
                    value="publish"
                    disabled={!canSave || pending}
                    className="rounded-lg bg-forest-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Create &amp; Publish
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
