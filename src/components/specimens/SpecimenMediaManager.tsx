/**
 * Cataloging UI for private specimen images and their presentation metadata.
 * It never accepts storage paths and does not manage specimen inventory or locations.
 */

"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useActionState, useState } from "react";
import {
  removeSpecimenMediaAction,
  setSpecimenMediaCoverAction,
  updateSpecimenMediaAction,
} from "@/features/specimens/media-actions";
import {
  firstMediaFormError,
  readSpecimenMediaUploadForm,
  SPECIMEN_MEDIA_ACCEPT,
  type MediaCommandState,
  type MediaFormState,
} from "@/features/specimens/media-form";
import {
  replaceSpecimenMediaResultSchema,
  specimenMediaSchema,
  type SpecimenMedia,
} from "@/features/specimens/types";

export type SpecimenMediaWithPreview = SpecimenMedia & {
  signedUrl: string | null;
};

type SpecimenMediaManagerProps = {
  specimenId: string;
  media: SpecimenMediaWithPreview[];
  readOnly: boolean;
};

type Notice = { tone: "success" | "warning" | "error"; message: string };

const inputClasses =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700";

async function responseMessage(response: Response) {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
      return body.message;
    }
  } catch {
    // A safe generic message below avoids exposing malformed proxy responses.
  }
  return "The image could not be saved. Check your connection and try again.";
}

function NoticeBox({ notice }: { notice: Notice }) {
  const styles =
    notice.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : notice.tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-950"
        : "border-red-200 bg-red-50 text-red-800";
  return (
    <div role={notice.tone === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {notice.message}
    </div>
  );
}

function UploadForm({ specimenId }: { specimenId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const parsed = readSpecimenMediaUploadForm(new FormData(form));
    if (!parsed.success) {
      setNotice({ tone: "error", message: firstMediaFormError(parsed.error) });
      return;
    }

    setPending(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/cataloging/specimens/${specimenId}/media/files`, {
        method: "POST",
        body: new FormData(form),
      });
      if (!response.ok) {
        setNotice({ tone: "error", message: await responseMessage(response) });
        return;
      }

      const result = specimenMediaSchema.safeParse(await response.json());
      if (!result.success) {
        setNotice({ tone: "error", message: "The upload completed but returned an invalid response. Reload the page." });
        return;
      }

      form.reset();
      setNotice({ tone: "success", message: "The specimen image was uploaded successfully." });
      router.refresh();
    } catch {
      setNotice({ tone: "error", message: "The image upload failed. Check your connection and try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-black/10 bg-white p-5 sm:p-6">
      <h2 className="font-serif text-lg font-semibold text-forest-800">Upload specimen image</h2>
      <p className="mt-1 text-sm text-zinc-600">
        JPEG, PNG, or WebP only, up to 15 MB. Images stay private and are viewed through short-lived links.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block text-xs font-medium text-zinc-700">
          Image file
          <input
            type="file"
            name="file"
            accept={SPECIMEN_MEDIA_ACCEPT}
            required
            disabled={pending}
            className={`${inputClasses} file:mr-3 file:rounded-md file:border-0 file:bg-sage-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-forest-800`}
          />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-zinc-700">
            Caption (optional)
            <input name="caption" maxLength={255} disabled={pending} className={inputClasses} />
          </label>
          <label className="text-xs font-medium text-zinc-700">
            Display order (optional)
            <input
              type="number"
              name="displayOrder"
              min={0}
              max={2147483647}
              step={1}
              disabled={pending}
              className={inputClasses}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" name="isCover" disabled={pending} />
          Use as the specimen cover image
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Uploading..." : "Upload image"}
        </button>
      </form>
      {notice && <div className="mt-4"><NoticeBox notice={notice} /></div>}
    </section>
  );
}

function MetadataForm({ specimenId, item }: { specimenId: string; item: SpecimenMedia }) {
  const action = updateSpecimenMediaAction.bind(null, specimenId, item.id);
  const [state, formAction, pending] = useActionState<MediaFormState, FormData>(action, {
    values: { caption: item.caption ?? "", displayOrder: String(item.displayOrder) },
  });

  return (
    <form action={formAction} className="space-y-3 border-t border-black/5 pt-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_9rem]">
        <label className="text-xs font-medium text-zinc-700">
          Caption
          <input
            name="caption"
            maxLength={255}
            defaultValue={state.values.caption}
            disabled={pending}
            className={inputClasses}
          />
          {state.errors?.caption?.[0] && <span className="mt-1 block text-xs text-red-700">{state.errors.caption[0]}</span>}
        </label>
        <label className="text-xs font-medium text-zinc-700">
          Display order
          <input
            type="number"
            name="displayOrder"
            min={0}
            max={2147483647}
            step={1}
            defaultValue={state.values.displayOrder}
            disabled={pending}
            className={inputClasses}
          />
          {state.errors?.displayOrder?.[0] && <span className="mt-1 block text-xs text-red-700">{state.errors.displayOrder[0]}</span>}
        </label>
      </div>
      <button type="submit" disabled={pending} className="rounded-md border border-forest-700 px-3 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50 disabled:opacity-60">
        {pending ? "Saving..." : "Save metadata"}
      </button>
      {state.message && <p role="alert" className="text-xs text-red-700">{state.message}</p>}
    </form>
  );
}

function ReplaceFileForm({ specimenId, mediaId }: { specimenId: string; mediaId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const raw = new FormData(form);
    const parsed = readSpecimenMediaUploadForm(raw);
    if (!parsed.success) {
      setNotice({ tone: "error", message: firstMediaFormError(parsed.error) });
      return;
    }
    if (!window.confirm("Replace this specimen image file? Its caption and display order will be retained.")) return;

    raw.set("mediaId", mediaId);
    setPending(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/cataloging/specimens/${specimenId}/media/files`, {
        method: "PUT",
        body: raw,
      });
      if (!response.ok) {
        setNotice({ tone: "error", message: await responseMessage(response) });
        return;
      }
      const result = replaceSpecimenMediaResultSchema.safeParse(await response.json());
      if (!result.success) {
        setNotice({ tone: "error", message: "The replacement completed but returned an invalid response. Reload the page." });
        return;
      }

      form.reset();
      setNotice({
        tone: result.data.previousStorageCleanupPending ? "warning" : "success",
        message: result.data.previousStorageCleanupPending
          ? "The new image is active, but the previous private object requires administrator cleanup."
          : "The specimen image file was replaced successfully.",
      });
      router.refresh();
    } catch {
      setNotice({ tone: "error", message: "The replacement failed. Check your connection and try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2 border-t border-black/5 pt-4">
      <label className="block text-xs font-medium text-zinc-700">
        Replace image file
        <input type="file" name="file" accept={SPECIMEN_MEDIA_ACCEPT} required disabled={pending} className={inputClasses} />
      </label>
      <button type="submit" disabled={pending} className="rounded-md border border-black/15 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60">
        {pending ? "Replacing..." : "Replace file"}
      </button>
      {notice && <NoticeBox notice={notice} />}
    </form>
  );
}

function CoverControl({ specimenId, mediaId }: { specimenId: string; mediaId: string }) {
  const action = setSpecimenMediaCoverAction.bind(null, specimenId, mediaId);
  const [state, formAction, pending] = useActionState<MediaCommandState, FormData>(action, {});
  return (
    <form action={formAction}>
      <button type="submit" disabled={pending} className="rounded-md border border-forest-700 px-3 py-2 text-xs font-semibold text-forest-800 hover:bg-forest-50 disabled:opacity-60">
        {pending ? "Setting..." : "Set as cover"}
      </button>
      {state.message && <p role="alert" className="mt-1 text-xs text-red-700">{state.message}</p>}
    </form>
  );
}

function RemoveControl({ specimenId, item }: { specimenId: string; item: SpecimenMedia }) {
  const action = removeSpecimenMediaAction.bind(null, specimenId, item.id);
  const [state, formAction, pending] = useActionState<MediaCommandState, FormData>(action, {});
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Remove ${item.caption ? `“${item.caption}”` : "this image"} from the specimen record?`)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" disabled={pending} className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
        {pending ? "Removing..." : "Remove"}
      </button>
      {state.message && <p role="alert" className="mt-1 text-xs text-red-700">{state.message}</p>}
    </form>
  );
}

function MediaCard({ specimenId, item, readOnly }: { specimenId: string; item: SpecimenMediaWithPreview; readOnly: boolean }) {
  return (
    <article className="overflow-hidden rounded-xl border border-black/10 bg-white">
      <div className="aspect-[4/3] bg-zinc-100">
        {item.signedUrl ? (
          // The browser loads the five-minute URL directly so Next's optimizer cannot cache a private image beyond expiry.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.signedUrl} alt={item.caption ?? "Specimen image"} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-500">
            Preview unavailable. Reload to request a fresh private link.
          </div>
        )}
      </div>
      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-zinc-900">{item.caption ?? "Uncaptioned image"}</h2>
            <p className="mt-1 text-xs text-zinc-500">Display order {item.displayOrder}</p>
          </div>
          {item.isCover && <span className="rounded-full bg-forest-100 px-2.5 py-1 text-xs font-semibold text-forest-800">Cover</span>}
        </div>

        {readOnly ? (
          <p className="border-t border-black/5 pt-4 text-xs text-zinc-500">Archived specimen media is read-only.</p>
        ) : (
          <>
            <MetadataForm specimenId={specimenId} item={item} />
            <ReplaceFileForm specimenId={specimenId} mediaId={item.id} />
            <div className="flex flex-wrap items-start justify-between gap-2 border-t border-black/5 pt-4">
              {!item.isCover && <CoverControl specimenId={specimenId} mediaId={item.id} />}
              <RemoveControl specimenId={specimenId} item={item} />
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export function SpecimenMediaManager({ specimenId, media, readOnly }: SpecimenMediaManagerProps) {
  return (
    <div className="space-y-5">
      {!readOnly && <UploadForm specimenId={specimenId} />}
      {readOnly && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-700">
          Media for archived specimen records remains viewable but cannot be changed.
        </div>
      )}

      {media.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-white p-6 text-sm text-zinc-500">
          No specimen images have been added.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {media.map((item) => <MediaCard key={item.id} specimenId={specimenId} item={item} readOnly={readOnly} />)}
        </div>
      )}
    </div>
  );
}
