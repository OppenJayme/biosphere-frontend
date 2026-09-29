/**
 * Curator editor for one exhibit's public content, images, and public URL (REQ-4.12-03, -10).
 * Changes save in place and keep this editor open; publishing lives in the side panel.
 */

"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, type FormEvent } from "react";
import { ImageIcon, InfoIcon, LayersIcon, LinkIcon, StarIcon, TrashIcon, UploadIcon, AlertTriangleIcon } from "@/components/icons";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import {
  removeExhibitMediaAction,
  replaceExhibitUrlAction,
  setExhibitCoverAction,
  updateExhibitAction,
  updateExhibitMediaAction,
} from "@/features/exhibits-qr/actions";
import {
  EXHIBIT_MEDIA_ACCEPT,
  exhibitImageError,
  SLUG_MAX_LENGTH,
  type ExhibitCommandState,
  type ExhibitContentValues,
  type ExhibitFormState,
} from "@/features/exhibits-qr/form";
import { exhibitLayout, sortExhibitMedia, type Exhibit, type ExhibitMedia } from "@/features/exhibits-qr/types";
import { ExhibitContentFields, FormMessage, inputClasses } from "./ExhibitParts";

const TABS = [
  { id: "content", label: "Content", icon: LayersIcon },
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "url", label: "Public URL", icon: LinkIcon },
] as const;
type TabId = (typeof TABS)[number]["id"];

const primaryButton =
  "rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60";

function contentValues(exhibit: Exhibit): ExhibitContentValues {
  return {
    publicDescription: exhibit.publicDescription ?? "",
    interestingFacts: exhibit.interestingFacts ?? "",
    distribution: exhibit.distribution ?? "",
    diet: exhibit.diet ?? "",
    layoutType: exhibitLayout(exhibit.layoutType),
  };
}

function ContentTab({ exhibit }: { exhibit: Exhibit }) {
  const action = updateExhibitAction.bind(null, exhibit.id, exhibit.publicSlug);
  const initial = contentValues(exhibit);
  const [state, formAction, pending] = useActionState<ExhibitFormState<ExhibitContentValues>, FormData>(action, {
    values: initial,
  });

  return (
    <form action={formAction} className="space-y-4">
      {exhibit.status === "PUBLISHED" && (
        <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          This exhibit is published. Saved changes appear on the public page right away. The URL and
          printed QR codes stay the same.
        </p>
      )}
      <p className="flex gap-2 rounded-lg bg-sage-50 px-3 py-2 text-xs text-zinc-600">
        <LayersIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
        Name, taxonomy, habitat, ecological role, and conservation status come from the specimen
        record. Edit them in Cataloging.
      </p>
      <input type="hidden" name="originalLayout" value={initial.layoutType} />
      <ExhibitContentFields idPrefix={`edit-${exhibit.id}`} values={state.values} errors={state.errors} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={primaryButton}>
          Save content
        </button>
        <FormMessage ok={state.ok} message={state.message} />
      </div>
      <PendingOverlay pending={pending} label="Saving exhibit content…" />
    </form>
  );
}

async function uploadMessage(response: Response) {
  const body: unknown = await response.json().catch(() => null);
  if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
    return body.message;
  }
  return "The image could not be uploaded. Try again.";
}

function UploadForm({ exhibit, firstImage }: { exhibit: Exhibit; firstImage: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const fileError = exhibitImageError(data.get("file"));
    if (fileError) {
      setStatus({ ok: false, message: fileError });
      return;
    }
    if (firstImage) data.set("isCover", "true");

    setPending(true);
    setStatus(null);
    try {
      const response = await fetch(`/api/exhibits/${exhibit.id}/media`, { method: "POST", body: data });
      if (!response.ok) {
        setStatus({ ok: false, message: await uploadMessage(response) });
        return;
      }
      form.reset();
      setStatus({ ok: true, message: "Image uploaded." });
      router.refresh();
    } catch {
      setStatus({ ok: false, message: "The image could not be uploaded. Check your connection and try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-dashed border-black/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Add an image</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-xs font-medium text-zinc-700">
          Image file (JPEG, PNG, or WebP, up to 15 MB)
          <input
            type="file"
            name="file"
            accept={EXHIBIT_MEDIA_ACCEPT}
            required
            className="mt-1.5 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-sage-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-forest-800 hover:file:bg-sage-200"
          />
        </label>
        <label className="text-xs font-medium text-zinc-700">
          Caption (optional)
          <input name="caption" maxLength={255} className={inputClasses} />
        </label>
        <button type="submit" disabled={pending} className={`${primaryButton} inline-flex items-center gap-1.5`}>
          <UploadIcon className="h-4 w-4" />
          Upload
        </button>
      </div>
      {firstImage && <p className="text-xs text-zinc-500">The first image becomes the cover photo.</p>}
      {status && <FormMessage ok={status.ok} message={status.message} />}
      <PendingOverlay pending={pending} label="Uploading image…" />
    </form>
  );
}

function MediaRow({ exhibit, media }: { exhibit: Exhibit; media: ExhibitMedia }) {
  const update = updateExhibitMediaAction.bind(null, exhibit.id, media.id, exhibit.publicSlug);
  const cover = setExhibitCoverAction.bind(null, exhibit.id, media.id, exhibit.publicSlug);
  const remove = removeExhibitMediaAction.bind(null, exhibit.id, media.id, exhibit.publicSlug);
  const [updateState, updateAction, updating] = useActionState<ExhibitCommandState, FormData>(update, {});
  const [coverState, coverAction, covering] = useActionState<ExhibitCommandState, FormData>(cover, {});
  const [removeState, removeAction, removing] = useActionState<ExhibitCommandState, FormData>(remove, {});
  const message = [updateState, coverState, removeState].find((state) => state.message);

  return (
    <li className="flex gap-3 rounded-lg border border-black/10 p-3">
      <span className="h-20 w-24 shrink-0 overflow-hidden rounded-md bg-sage-100">
        {media.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={media.previewUrl} alt={media.caption ?? "Exhibit image"} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-[11px] text-zinc-400">No preview</span>
        )}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <form action={updateAction} className="grid gap-2 sm:grid-cols-[1fr_7rem_auto] sm:items-end">
          <label className="text-xs font-medium text-zinc-700">
            Caption
            <input name="caption" maxLength={255} defaultValue={media.caption ?? ""} className={inputClasses} />
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Order
            <input
              name="displayOrder"
              inputMode="numeric"
              pattern="[0-9]*"
              defaultValue={String(media.displayOrder)}
              className={inputClasses}
            />
          </label>
          <button
            type="submit"
            disabled={updating}
            className="rounded-lg border border-black/15 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-sage-100 disabled:opacity-60"
          >
            Save
          </button>
          <PendingOverlay pending={updating} label="Saving image details…" />
        </form>
        <div className="flex flex-wrap items-center gap-3">
          {media.isCover ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-[11px] font-medium text-gold-700">
              <StarIcon className="h-3 w-3" />
              Cover photo
            </span>
          ) : (
            <form action={coverAction}>
              <button
                type="submit"
                disabled={covering}
                className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:underline disabled:opacity-60"
              >
                <StarIcon className="h-3 w-3" />
                Set as cover
              </button>
              <PendingOverlay pending={covering} label="Changing cover…" />
            </form>
          )}
          <form action={removeAction}>
            <ConfirmButton
              label={
                <span className="inline-flex items-center gap-1">
                  <TrashIcon className="h-3.5 w-3.5" />
                  Remove
                </span>
              }
              question="Remove this image?"
              detail={
                exhibit.status === "PUBLISHED"
                  ? "It disappears from the public exhibit page right away."
                  : "It will not appear when the exhibit is published."
              }
              confirmLabel="Yes, remove"
              tone="danger"
              pending={removing}
              pendingLabel="Removing image…"
              className="text-xs font-semibold text-red-700 hover:underline disabled:opacity-60"
            />
          </form>
          {message?.message && <FormMessage ok={message.ok} message={message.message} />}
        </div>
      </div>
    </li>
  );
}

function ImagesTab({ exhibit }: { exhibit: Exhibit }) {
  const media = sortExhibitMedia(exhibit.media ?? []);
  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">
        Images appear on the public page with the cover photo first, then by display order (lowest first).
      </p>
      {media.length === 0 ? (
        <p className="rounded-lg bg-sage-50 px-3 py-6 text-center text-xs text-zinc-500">No images yet.</p>
      ) : (
        <ul className="space-y-2">
          {media.map((item) => (
            <MediaRow key={item.id} exhibit={exhibit} media={item} />
          ))}
        </ul>
      )}
      <UploadForm exhibit={exhibit} firstImage={media.length === 0} />
    </div>
  );
}

function UrlTab({ exhibit }: { exhibit: Exhibit }) {
  const action = replaceExhibitUrlAction.bind(null, exhibit.id, exhibit.publicSlug);
  const [state, formAction, pending] = useActionState<ExhibitFormState<{ publicSlug: string }>, FormData>(action, {
    values: { publicSlug: "" },
  });
  const [slug, setSlug] = useState(state.values.publicSlug);
  const [seenState, setSeenState] = useState(state);
  // Clear the input once a replacement succeeds (adjusting state during render, not in an effect).
  if (state !== seenState) {
    setSeenState(state);
    if (state.ok) setSlug("");
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <p className="text-xs font-medium text-zinc-700">Current public URL</p>
        <p className="mt-1 break-all rounded-lg bg-sage-50 px-3 py-2 font-mono text-xs text-zinc-800">
          {exhibit.publicUrl ?? `/exhibits/${exhibit.publicSlug}`}
        </p>
        <p className="mt-1 text-xs text-zinc-500">Editing content never changes this URL.</p>
      </div>

      <div className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-xs text-red-900">
        <AlertTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
        <div className="space-y-1">
          <p className="font-semibold">Only replace the URL if you mean to retire the old one.</p>
          <p>
            Every QR label already printed for <span className="font-mono">/exhibits/{exhibit.publicSlug}</span> will
            stop working and show an unavailable message. You will need to print and post a new label. The old
            URL stays reserved, so no other exhibit can take it.
          </p>
        </div>
      </div>

      <label className="block text-xs font-medium text-zinc-700">
        New URL ending
        <span className="mt-1.5 flex items-center rounded-lg border border-black/15 bg-white focus-within:border-forest-700 focus-within:ring-1 focus-within:ring-forest-700">
          <span className="pl-3 font-mono text-xs text-zinc-500">/exhibits/</span>
          <input
            name="publicSlug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            maxLength={SLUG_MAX_LENGTH}
            autoComplete="off"
            spellCheck={false}
            placeholder="e.g. mountain-gorilla-2"
            className="w-full rounded-r-lg bg-transparent py-2 pr-3 font-mono text-sm text-zinc-900 focus:outline-none"
          />
        </span>
        <span className="mt-1 block font-normal text-zinc-500">
          Lowercase letters and numbers, separated by single hyphens.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <ConfirmButton
          label="Replace public URL"
          question="Replace this exhibit's public URL?"
          detail={`Printed QR codes for /exhibits/${exhibit.publicSlug} will stop working. The page will move to /exhibits/${slug.trim() || "…"}.`}
          confirmLabel="Yes, replace URL"
          tone="danger"
          disabled={!slug.trim() || slug.trim() === exhibit.publicSlug}
          pending={pending}
          pendingLabel="Replacing URL…"
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <FormMessage ok={state.ok} message={state.message} />
      </div>
    </form>
  );
}

export function ExhibitEditor({ exhibit }: { exhibit: Exhibit }) {
  const [tab, setTab] = useState<TabId>("content");

  return (
    <section
      id="exhibit-editor"
      aria-labelledby="exhibit-editor-heading"
      className="scroll-mt-4 rounded-xl border border-black/10 bg-white p-5"
    >
      <h2 id="exhibit-editor-heading" className="text-sm font-semibold text-zinc-900">
        Edit exhibit: {exhibit.specimen.commonName ?? exhibit.publicSlug}
      </h2>

      <div role="tablist" aria-label="Exhibit editor sections" className="mt-3 flex gap-5 border-b border-black/10">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`exhibit-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`exhibit-panel-${id}`}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 border-b-2 py-2.5 text-sm font-medium whitespace-nowrap ${
              tab === id ? "border-forest-700 text-forest-800" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === "images" && ` (${exhibit.media?.length ?? 0})`}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`exhibit-panel-${tab}`} aria-labelledby={`exhibit-tab-${tab}`} className="pt-5">
        {tab === "content" && <ContentTab exhibit={exhibit} />}
        {tab === "images" && <ImagesTab exhibit={exhibit} />}
        {tab === "url" && <UrlTab exhibit={exhibit} />}
      </div>
    </section>
  );
}
