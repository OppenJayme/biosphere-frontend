"use client";

import { useEffect, useState, useTransition, type ComponentType, type ReactNode, type SVGProps } from "react";
import Link from "next/link";
import {
  ExternalLinkIcon,
  PrinterIcon,
  DownloadIcon,
  PencilIcon,
  CloseIcon,
  LinkIcon,
  ClockIcon,
  GridIcon,
  ImageIcon,
  ArchiveIcon,
  CalendarIcon,
  ChevronDownIcon,
  CubeIcon,
  DotsIcon,
  EyeOffIcon,
  GlobeIcon,
  QrCodeIcon,
  SparkleIcon,
  TrashIcon,
} from "@/components/icons";
import { ActionMenu, type ActionMenuItem } from "@/components/ui/ActionMenu";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PendingOverlay } from "@/components/ui/LoadingOverlay";
import {
  changeExhibitStatusAction,
  loadExhibitMediaAction,
  replaceExhibitUrlAction,
  setExhibitArAction,
  setExhibitArSelectionAction,
  type ExhibitMediaResult,
} from "@/features/exhibits-qr/actions";
import type { ExhibitLifecycleCommand, ExhibitQrFile } from "@/features/exhibits-qr/api";
import { AR_SELECTION_NOTE_MAX_LENGTH, SLUG_MAX_LENGTH } from "@/features/exhibits-qr/form";
import { EXHIBIT_STATUS_LABELS, exhibitDisplayName, type ExhibitRow } from "@/features/exhibits-qr/types";
import { formatExhibitDate, layoutLabel, STATUS_STYLES } from "./exhibit-format";
import type { ExhibitNotice } from "./ExhibitsWorkspace";
import { ImageCarousel, PhotoLoading } from "@/components/ui/ImageViewer";

function MediaPreview({ media, alt }: { media: ExhibitMediaResult | null; alt: string }) {
  if (media && media.previews.length > 0) {
    return (
      <ImageCarousel
        images={media.previews.map((preview) => ({
          src: preview.mediaUrl,
          alt: preview.caption ?? alt,
          caption: preview.caption,
        }))}
      />
    );
  }

  if (!media) {
    return (
      <div className="relative aspect-4/3 overflow-hidden rounded-lg">
        <PhotoLoading label="Loading images…" />
      </div>
    );
  }

  let text: string;
  if (media.message) text = media.message;
  else if (media.media.length === 0) text = "No images uploaded yet.";
  else {
    text = `${media.media.length} image${media.media.length === 1 ? "" : "s"} uploaded. Images can be previewed here once the exhibit is published.`;
  }

  return (
    <div className="flex aspect-4/3 flex-col items-center justify-center gap-2 rounded-lg bg-sage-100 px-6 text-center text-xs text-zinc-500">
      <ImageIcon className="h-6 w-6 text-forest-700/60" />
      {text}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-xs">
      <span className="flex items-center gap-1.5 text-zinc-500">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
      <span className="text-right font-medium break-all text-zinc-800">{children}</span>
    </div>
  );
}

async function responseMessage(response: Response, fallback: string) {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "message" in body && typeof body.message === "string") return body.message;
  } catch {
    // Fall through to the fallback.
  }
  return fallback;
}

/** Fetches a QR file through the same-origin route so failures (e.g. no public site URL) are reported. */
async function fetchQrFile(exhibitId: string, file: ExhibitQrFile) {
  const response = await fetch(`/api/exhibits/${exhibitId}/qr?file=${file}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(await responseMessage(response, "The QR code could not be generated. Try again."));
  }
  return response.blob();
}

const QR_FILE_NAMES: Record<ExhibitQrFile, (slug: string) => string> = {
  "qr-png": (slug) => `${slug}-qr.png`,
  "qr-svg": (slug) => `${slug}-qr.svg`,
  label: (slug) => `${slug}-label.svg`,
};

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Prints the label from a hidden frame. The SVG is shown through <img>, which never runs
 * scripts, and sized to a typical 10 cm label.
 */
function printBlob(blob: Blob, title: string) {
  const url = URL.createObjectURL(blob);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
  const cleanup = () => {
    frame.remove();
    URL.revokeObjectURL(url);
  };
  frame.onload = () => {
    const view = frame.contentWindow;
    const image = frame.contentDocument?.querySelector("img");
    if (!view || !image) return cleanup();
    const print = () => {
      view.addEventListener("afterprint", () => setTimeout(cleanup, 0), { once: true });
      view.focus();
      view.print();
    };
    if (image.complete) print();
    else image.addEventListener("load", print, { once: true });
  };
  const safeTitle = title.replace(/[<>&"]/g, "");
  frame.srcdoc = `<!doctype html><title>${safeTitle}</title><style>@page{margin:1cm}html,body{margin:0}img{width:10cm;height:auto;display:block;margin:0 auto}</style><img src="${url}" alt="">`;
  document.body.append(frame);
}

/**
 * Curator marks an exhibit for AR preparation (REQ-4.13-02). The listed considerations come from
 * SRS 4.13.1 and are guidance only: nothing is scored or ranked (REQ-4.13-08). The note is shown
 * to the developer who deploys the model.
 */
function ArSelectionForm({
  exhibit,
  onDone,
  onNotice,
}: {
  exhibit: ExhibitRow;
  onDone: () => void;
  onNotice: (notice: ExhibitNotice) => void;
}) {
  const [note, setNote] = useState(exhibit.arSelectionNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const unchanged = exhibit.arSelected && note.trim() === (exhibit.arSelectionNote ?? "");

  function submit() {
    startTransition(async () => {
      const result = await setExhibitArSelectionAction(exhibit.id, exhibit.publicSlug, true, note);
      if (!result.ok) {
        setError(result.message ?? "The AR selection could not be saved.");
        return;
      }
      onNotice({ tone: "success", message: result.message ?? "AR selection saved." });
      onDone();
    });
  }

  return (
    <div className="space-y-2 rounded-lg border border-forest-700/20 bg-forest-50 p-3 text-xs text-zinc-700">
      <label htmlFor="ar-selection-note" className="block font-semibold text-zinc-800">
        Reason for AR (optional, shown to the developer)
      </label>
      <textarea
        id="ar-selection-note"
        rows={3}
        value={note}
        maxLength={AR_SELECTION_NOTE_MAX_LENGTH}
        onChange={(e) => {
          setNote(e.target.value);
          setError(null);
        }}
        placeholder="e.g. Endemic species featured in the Grade 7 biodiversity tour"
        className="w-full resize-none rounded-lg border border-black/15 bg-white px-2.5 py-2 text-zinc-900 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700"
      />
      <p className="text-zinc-500">
        You may consider its research or educational objective, conservation status, rarity, endemism, exotic or
        invasive status, and economic or ecological value. The choice is yours; BioSphere does not score
        specimens.
      </p>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <ConfirmButton
          label={exhibit.arSelected ? "Save note" : "Mark for AR"}
          question={exhibit.arSelected ? "Save this AR note?" : "Mark this exhibit for AR?"}
          detail={
            exhibit.arSelected
              ? "The developer who deploys the model will see the updated reason."
              : "Developers will be able to deploy an AR model for it. You can withdraw the selection later."
          }
          confirmLabel={exhibit.arSelected ? "Save note" : "Mark for AR"}
          pending={pending}
          pendingLabel="Saving…"
          disabled={unchanged}
          onConfirm={submit}
          className="flex-1 rounded-lg bg-forest-700 px-3 py-2 font-semibold text-white hover:bg-forest-800 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={pending}
          onClick={onDone}
          className="flex-1 rounded-lg border border-black/15 bg-white px-3 py-2 font-semibold text-zinc-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Curator switch for developer-uploaded AR models; unavailable until marked for AR and a model is uploaded. */
function ArSwitch({
  exhibit,
  pending,
  onChange,
}: {
  exhibit: ExhibitRow;
  pending: boolean;
  onChange: (enabled: boolean) => void;
}) {
  const unavailable = !exhibit.arSelected || exhibit.arAssetCount === 0;
  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={exhibit.arEnabled}
        aria-label="View in AR on the public page"
        disabled={pending || unavailable}
        onClick={() => onChange(!exhibit.arEnabled)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          exhibit.arEnabled ? "bg-forest-700" : "bg-zinc-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
            exhibit.arEnabled ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
      <span className="text-[0.6875rem] font-normal text-zinc-500">
        {!exhibit.arSelected
          ? "Mark for AR first"
          : exhibit.arAssetCount === 0
          ? "Waiting for a developer to upload a model"
          : `${exhibit.arEnabled ? "On" : "Off"} · ${exhibit.arAssetCount} model${exhibit.arAssetCount === 1 ? "" : "s"}`}
      </span>
    </span>
  );
}

/** Deliberate URL replacement. Printed QR labels for the old URL stop working (REQ-4.12-10). */
function ReplaceUrlForm({
  exhibit,
  onDone,
  onNotice,
}: {
  exhibit: ExhibitRow;
  onDone: () => void;
  onNotice: (notice: ExhibitNotice) => void;
}) {
  const [slug, setSlug] = useState(exhibit.publicSlug);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const unchanged = slug.trim() === exhibit.publicSlug;

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await replaceExhibitUrlAction(exhibit.id, exhibit.publicSlug, formData);
      if (!result.ok) {
        setError(result.message ?? "The URL could not be replaced.");
        return;
      }
      onNotice({ tone: "success", message: result.message ?? "Public URL replaced." });
      onDone();
    });
  }

  return (
    <form action={submit} className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
      <label htmlFor="replace-slug" className="block font-semibold">
        New URL ending
      </label>
      <div className="flex items-center rounded-lg border border-black/15 bg-white focus-within:border-forest-700 focus-within:ring-1 focus-within:ring-forest-700">
        <span className="pl-2.5 text-zinc-400">/exhibits/</span>
        <input
          id="replace-slug"
          name="publicSlug"
          value={slug}
          maxLength={SLUG_MAX_LENGTH}
          onChange={(e) => {
            setSlug(e.target.value);
            setError(null);
          }}
          autoComplete="off"
          className="w-full rounded-r-lg py-2 pr-2.5 text-zinc-900 focus:outline-none"
        />
      </div>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <p>
        QR labels already printed for /exhibits/{exhibit.publicSlug} will stop working. Print new labels after
        replacing the URL.
      </p>
      <div className="flex gap-2">
        <ConfirmButton
          label="Replace URL"
          question="Replace the public URL?"
          detail={`QR labels already printed for /exhibits/${exhibit.publicSlug} will stop working. Print new labels afterwards.`}
          confirmLabel="Replace URL"
          tone="danger"
          pending={pending}
          pendingLabel="Replacing URL…"
          disabled={unchanged}
          className="flex-1 rounded-lg bg-amber-600 px-3 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={pending}
          onClick={onDone}
          className="flex-1 rounded-lg border border-black/15 bg-white px-3 py-2 font-semibold text-zinc-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// whitespace-nowrap and tighter padding keep "QR & Label" and "More actions" on one line in the
// 340px panel at the curator's larger base text size.
const secondaryButton =
  "flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-black/15 px-2.5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-sage-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent";

/** Every state-changing action in this panel is confirmed in the shared dialog first. */
type PanelConfirm = "publish" | "unpublish" | "disable" | "archive" | "withdraw-ar" | "ar-on" | "ar-off";

const CONFIRM_COPY: Record<
  PanelConfirm,
  { title: string; message: (exhibit: ExhibitRow) => string; confirmLabel: string; danger?: boolean; pendingLabel: string }
> = {
  publish: {
    title: "Publish this exhibit?",
    message: () => "Its public page and QR code start working for visitors.",
    confirmLabel: "Publish",
    pendingLabel: "Publishing…",
  },
  unpublish: {
    title: "Unpublish this exhibit?",
    message: () => "Its public page and QR code stop working until you publish it again.",
    confirmLabel: "Unpublish",
    pendingLabel: "Unpublishing…",
  },
  disable: {
    title: "Disable this exhibit?",
    message: () =>
      "Its public page and QR code stop working, and a disabled exhibit cannot be published again. To take the page offline temporarily, unpublish it instead.",
    confirmLabel: "Disable",
    danger: true,
    pendingLabel: "Disabling…",
  },
  archive: {
    title: "Archive this exhibit?",
    message: () =>
      "Its public page and QR code stop working, and it leaves this list. The record is kept for the audit history.",
    confirmLabel: "Archive",
    danger: true,
    pendingLabel: "Archiving…",
  },
  "withdraw-ar": {
    title: "Withdraw the AR selection?",
    message: (exhibit) =>
      `${exhibit.arEnabled ? "View in AR turns off on the public page. " : ""}Developers can no longer deploy or activate models for this exhibit. Uploaded models are kept until a developer removes them.`,
    confirmLabel: "Withdraw",
    danger: true,
    pendingLabel: "Withdrawing…",
  },
  "ar-on": {
    title: "Turn on View in AR?",
    message: () => "Visitors will see a View in AR button on this exhibit's public page.",
    confirmLabel: "Turn on",
    pendingLabel: "Turning on AR…",
  },
  "ar-off": {
    title: "Turn off View in AR?",
    message: () => "The View in AR button is removed from this exhibit's public page. Uploaded models are kept.",
    confirmLabel: "Turn off",
    pendingLabel: "Turning off AR…",
  },
};

export function ExhibitDetailPanel({
  exhibit,
  onClear,
  onEdit,
  onNotice,
  onArchived,
}: {
  exhibit: ExhibitRow | null;
  onClear: () => void;
  onEdit: (id: string) => void;
  onNotice: (notice: ExhibitNotice) => void;
  onArchived: () => void;
}) {
  // Tagged with the exhibit and status it was loaded for, so selecting another exhibit shows the
  // loader instead of the previous exhibit's photos until its own response arrives.
  const [loadedMedia, setLoadedMedia] = useState<{ key: string; result: ExhibitMediaResult } | null>(null);
  const [confirm, setConfirm] = useState<PanelConfirm | null>(null);
  // Kept after the dialog closes so the loading overlay can name the action that is running.
  const [running, setRunning] = useState<PanelConfirm | null>(null);
  const [replacingUrl, setReplacingUrl] = useState(false);
  const [editingArSelection, setEditingArSelection] = useState(false);
  const [qrBusy, setQrBusy] = useState<ExhibitQrFile | "print" | null>(null);
  const [pending, startTransition] = useTransition();
  const exhibitId = exhibit?.id;
  const status = exhibit?.status;
  const mediaKey = `${exhibitId}:${status}`;
  const media = loadedMedia?.key === mediaKey ? loadedMedia.result : null;

  // Reload when the status changes too: preview links exist only while published.
  useEffect(() => {
    if (!exhibitId) return;
    let cancelled = false;
    loadExhibitMediaAction(exhibitId).then((result) => {
      if (!cancelled) setLoadedMedia({ key: `${exhibitId}:${status}`, result });
    });
    return () => {
      cancelled = true;
    };
  }, [exhibitId, status]);

  if (!exhibit) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-5">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">Selected Exhibit</h3>
        <p className="py-6 text-center text-xs text-zinc-500">
          Select an exhibit from the table to see its details here.
        </p>
      </div>
    );
  }

  const name = exhibitDisplayName(exhibit);
  const current = exhibit;

  function run(command: ExhibitLifecycleCommand) {
    startTransition(async () => {
      const result = await changeExhibitStatusAction(current.id, current.publicSlug, command);
      onNotice({ tone: result.ok ? "success" : "error", message: result.message ?? "The exhibit could not be changed." });
      if (result.ok && command === "archive") onArchived();
    });
  }

  function withdrawArSelection() {
    startTransition(async () => {
      const result = await setExhibitArSelectionAction(current.id, current.publicSlug, false, "");
      onNotice({ tone: result.ok ? "success" : "error", message: result.message ?? "The AR selection could not be changed." });
    });
  }

  function toggleAr(enabled: boolean) {
    startTransition(async () => {
      const result = await setExhibitArAction(current.id, current.publicSlug, enabled);
      onNotice({ tone: result.ok ? "success" : "error", message: result.message ?? "AR could not be changed." });
    });
  }

  function confirmed(action: PanelConfirm) {
    setConfirm(null);
    setRunning(action);
    if (action === "withdraw-ar") withdrawArSelection();
    else if (action === "ar-on") toggleAr(true);
    else if (action === "ar-off") toggleAr(false);
    else run(action);
  }

  const qrItems: ActionMenuItem[] = [
    { label: "Print Label", icon: PrinterIcon, onSelect: () => void qrFile("label", "print") },
    { label: "Download QR (PNG)", icon: DownloadIcon, onSelect: () => void qrFile("qr-png", "download") },
    { label: "Download QR (SVG)", icon: DownloadIcon, onSelect: () => void qrFile("qr-svg", "download") },
    { label: "Download Label (SVG)", icon: DownloadIcon, onSelect: () => void qrFile("label", "download") },
  ];

  const moreItems: ActionMenuItem[] = [
    ...(current.status === "UNPUBLISHED"
      ? [{ label: "Publish", icon: GlobeIcon, onSelect: () => setConfirm("publish") } satisfies ActionMenuItem]
      : []),
    ...(current.status === "PUBLISHED"
      ? [
          { label: "Unpublish", icon: EyeOffIcon, onSelect: () => setConfirm("unpublish") } satisfies ActionMenuItem,
          { label: "Disable", icon: CloseIcon, onSelect: () => setConfirm("disable") } satisfies ActionMenuItem,
        ]
      : []),
    {
      label: "Archive Exhibit",
      icon: ArchiveIcon,
      onSelect: () => setConfirm("archive"),
      danger: true,
      separated: current.status !== "DISABLED",
    },
  ];

  async function qrFile(file: ExhibitQrFile, mode: "download" | "print") {
    if (qrBusy) return;
    setQrBusy(mode === "print" ? "print" : file);
    try {
      const blob = await fetchQrFile(current.id, file);
      if (mode === "print") printBlob(blob, `${name} label`);
      else saveBlob(blob, QR_FILE_NAMES[file](current.publicSlug));
    } catch (error) {
      onNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "The QR code could not be generated. Try again.",
      });
    } finally {
      setQrBusy(null);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-black/10 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Selected Exhibit</h3>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="text-zinc-400 hover:text-zinc-600"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>

      <MediaPreview media={media} alt={name} />

      <div>
        <p className="text-sm font-semibold text-zinc-900">{name}</p>
        {exhibit.specimen?.scientificName && (
          <p className="text-xs italic text-zinc-500">{exhibit.specimen.scientificName}</p>
        )}
      </div>

      <div className="divide-y divide-black/5 border-t border-black/5">
        <InfoRow icon={LinkIcon} label="Public URL">
          {exhibit.publicUrl ?? `/exhibits/${exhibit.publicSlug}`}
          {!replacingUrl && (
            <button
              type="button"
              onClick={() => setReplacingUrl(true)}
              className="mt-0.5 block w-full text-right text-[0.6875rem] font-semibold text-forest-700 underline hover:text-forest-800"
            >
              Replace URL
            </button>
          )}
        </InfoRow>
        {replacingUrl && (
          <div className="py-2">
            <ReplaceUrlForm exhibit={exhibit} onDone={() => setReplacingUrl(false)} onNotice={onNotice} />
          </div>
        )}
        <InfoRow icon={PencilIcon} label="Publish Status">
          <span className={`rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${STATUS_STYLES[exhibit.status]}`}>
            {EXHIBIT_STATUS_LABELS[exhibit.status]}
          </span>
        </InfoRow>
        <InfoRow icon={GridIcon} label="Page Layout">
          {layoutLabel(exhibit.layoutType)}
        </InfoRow>
        <InfoRow icon={CalendarIcon} label="Published">
          {formatExhibitDate(exhibit.publishedAt)}
        </InfoRow>
        <InfoRow icon={ClockIcon} label="Last Updated">
          {formatExhibitDate(exhibit.updatedAt)}
        </InfoRow>
        <InfoRow icon={SparkleIcon} label="AR Selection">
          {exhibit.arSelected ? (
            <>
              <span className="flex items-center justify-end gap-1">
                <span className="rounded-full bg-forest-100 px-2 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap text-forest-700">
                  Marked for AR
                </span>
                {!editingArSelection && (
                  <ActionMenu
                    label="AR selection actions"
                    trigger={<DotsIcon className="h-4 w-4" />}
                    disabled={pending}
                    className="rounded-md p-1 text-zinc-500 hover:bg-sage-100 hover:text-forest-800 focus-visible:outline-2 focus-visible:outline-forest-700 disabled:opacity-50"
                    items={[
                      { label: "Edit note", icon: PencilIcon, onSelect: () => setEditingArSelection(true) },
                      {
                        label: "Withdraw",
                        icon: TrashIcon,
                        onSelect: () => setConfirm("withdraw-ar"),
                        danger: true,
                        separated: true,
                      },
                    ]}
                  />
                )}
              </span>
              {/* break-normal + nowrap: the row's break-all used to split "10:29 AM" across lines. */}
              <span className="mt-0.5 block text-[0.6875rem] font-normal break-normal whitespace-nowrap text-zinc-500">
                Since {formatExhibitDate(exhibit.arSelectedAt)}
              </span>
            </>
          ) : (
            <>
              <span className="font-normal break-normal text-zinc-500">Not selected</span>
              {!editingArSelection && (
                <button
                  type="button"
                  onClick={() => setEditingArSelection(true)}
                  className="mt-0.5 block w-full text-right text-[0.6875rem] font-semibold text-forest-700 underline hover:text-forest-800"
                >
                  Mark for AR
                </button>
              )}
            </>
          )}
        </InfoRow>
        {exhibit.arSelected && exhibit.arSelectionNote && !editingArSelection && (
          <p className="py-2 text-xs whitespace-pre-line text-zinc-600">
            <span className="font-semibold text-zinc-700">Reason: </span>
            {exhibit.arSelectionNote}
          </p>
        )}
        {editingArSelection && (
          <div className="py-2">
            <ArSelectionForm exhibit={exhibit} onDone={() => setEditingArSelection(false)} onNotice={onNotice} />
          </div>
        )}
        <InfoRow icon={CubeIcon} label="View in AR">
          <ArSwitch
            exhibit={exhibit}
            pending={pending}
            onChange={(enabled) => setConfirm(enabled ? "ar-on" : "ar-off")}
          />
        </InfoRow>
      </div>

      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() => onEdit(exhibit.id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
        >
          <PencilIcon className="h-4 w-4" />
          Edit Exhibit
        </button>

        {exhibit.status === "PUBLISHED" ? (
          <Link
            href={`/exhibits/${exhibit.publicSlug}`}
            target="_blank"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-forest-700 px-4 py-2.5 text-sm font-semibold text-forest-700 hover:bg-forest-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Preview Public Page
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="Only published exhibits have a public page."
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 px-4 py-2.5 text-sm font-semibold text-zinc-400"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Preview Public Page
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <ActionMenu
            trigger={
              <>
                <QrCodeIcon className="h-4 w-4" />
                {qrBusy ? "Preparing…" : "QR & Label"}
                <ChevronDownIcon className="h-3.5 w-3.5" />
              </>
            }
            items={qrItems}
            disabled={qrBusy !== null}
            align="start"
            className={secondaryButton}
          />
          <ActionMenu
            trigger={
              <>
                <DotsIcon className="h-4 w-4" />
                More actions
              </>
            }
            items={moreItems}
            disabled={pending}
            className={secondaryButton}
          />
        </div>

        {exhibit.status === "UNPUBLISHED" && (
          <p className="text-center text-[0.6875rem] text-zinc-500">
            Not published yet. Publish it from More actions; the QR code only opens a page once it is published.
          </p>
        )}
        {exhibit.status === "DISABLED" && (
          <p className="rounded-lg bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
            This exhibit is disabled and cannot be published again. Archive it if it is no longer needed.
          </p>
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        title={confirm ? CONFIRM_COPY[confirm].title : ""}
        message={confirm ? CONFIRM_COPY[confirm].message(exhibit) : undefined}
        confirmLabel={confirm ? CONFIRM_COPY[confirm].confirmLabel : "Confirm"}
        tone={confirm && CONFIRM_COPY[confirm].danger ? "danger" : "default"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => confirm && confirmed(confirm)}
      />
      <PendingOverlay pending={pending && running !== null} label={running ? CONFIRM_COPY[running].pendingLabel : undefined} />
    </div>
  );
}
