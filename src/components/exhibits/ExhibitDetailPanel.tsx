"use client";

import { useEffect, useState, useTransition, type ComponentType, type ReactNode, type SVGProps } from "react";
import Link from "next/link";
import {
  ExternalLinkIcon,
  PrinterIcon,
  DownloadIcon,
  PencilIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  ClockIcon,
  GridIcon,
  ImageIcon,
  ArchiveIcon,
  CalendarIcon,
  CubeIcon,
} from "@/components/icons";
import {
  changeExhibitStatusAction,
  loadExhibitMediaAction,
  replaceExhibitUrlAction,
  setExhibitArAction,
  type ExhibitMediaResult,
} from "@/features/exhibits-qr/actions";
import type { ExhibitLifecycleCommand, ExhibitQrFile } from "@/features/exhibits-qr/api";
import { SLUG_MAX_LENGTH } from "@/features/exhibits-qr/form";
import { EXHIBIT_STATUS_LABELS, exhibitDisplayName, type ExhibitRow } from "@/features/exhibits-qr/types";
import { formatExhibitDate, layoutLabel, STATUS_STYLES } from "./exhibit-format";
import type { ExhibitNotice } from "./ExhibitsWorkspace";

function Carousel({ images, alt }: { images: { mediaUrl: string; caption: string | null }[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const image = images[index];

  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-sage-100">
      {/* Short-lived signed storage links, so next/image optimisation is not used. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.mediaUrl} alt={image.caption ?? alt} className="h-full w-full object-cover" />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white">
            {index + 1}/{images.length}
          </span>
        </>
      )}
    </div>
  );
}

function MediaPreview({ media, alt }: { media: ExhibitMediaResult | null; alt: string }) {
  if (media && media.previews.length > 0) return <Carousel images={media.previews} alt={alt} />;

  let text = "Loading images…";
  if (media?.message) text = media.message;
  else if (media && media.media.length === 0) text = "No images uploaded yet.";
  else if (media) {
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

/** Curator switch for developer-uploaded AR models; unavailable until at least one is uploaded. */
function ArSwitch({
  exhibit,
  pending,
  onChange,
}: {
  exhibit: ExhibitRow;
  pending: boolean;
  onChange: (enabled: boolean) => void;
}) {
  const unavailable = exhibit.arAssetCount === 0;
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
      <span className="text-[11px] font-normal text-zinc-500">
        {unavailable
          ? "No AR model uploaded yet"
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
        <button
          type="submit"
          disabled={pending || unchanged}
          className="flex-1 rounded-lg bg-amber-600 px-3 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? "Replacing…" : "Replace URL"}
        </button>
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

const secondaryButton =
  "flex items-center justify-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-sage-100 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent";

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
  const [media, setMedia] = useState<ExhibitMediaResult | null>(null);
  const [confirm, setConfirm] = useState<"archive" | "disable" | null>(null);
  const [replacingUrl, setReplacingUrl] = useState(false);
  const [qrBusy, setQrBusy] = useState<ExhibitQrFile | "print" | null>(null);
  const [pending, startTransition] = useTransition();
  const exhibitId = exhibit?.id;
  const status = exhibit?.status;

  // Reload when the status changes too: preview links exist only while published.
  useEffect(() => {
    if (!exhibitId) return;
    let cancelled = false;
    loadExhibitMediaAction(exhibitId).then((result) => {
      if (!cancelled) setMedia(result);
    });
    return () => {
      cancelled = true;
    };
  }, [exhibitId, status]);

  if (!exhibit) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-4">
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
      setConfirm(null);
    });
  }

  function toggleAr(enabled: boolean) {
    startTransition(async () => {
      const result = await setExhibitArAction(current.id, current.publicSlug, enabled);
      onNotice({ tone: result.ok ? "success" : "error", message: result.message ?? "AR could not be changed." });
    });
  }

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
    <div className="space-y-4 rounded-xl border border-black/10 bg-white p-4">
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
              className="mt-0.5 block w-full text-right text-[11px] font-semibold text-forest-700 underline hover:text-forest-800"
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
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[exhibit.status]}`}>
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
        <InfoRow icon={CubeIcon} label="View in AR">
          <ArSwitch exhibit={exhibit} pending={pending} onChange={toggleAr} />
        </InfoRow>
      </div>

      <div className="space-y-2 pt-1">
        {exhibit.status === "PUBLISHED" ? (
          <Link
            href={`/exhibits/${exhibit.publicSlug}`}
            target="_blank"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-forest-700 px-4 py-2.5 text-sm font-semibold text-forest-700 hover:bg-forest-50"
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

        {exhibit.status === "UNPUBLISHED" && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("publish")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-50"
          >
            {pending ? "Working…" : "Publish Exhibit"}
          </button>
        )}

        {exhibit.status === "PUBLISHED" &&
          (confirm === "disable" ? (
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <p>
                Disable this exhibit? Its public page and QR code stop working, and a disabled exhibit cannot be
                published again. To take the page offline temporarily, unpublish it instead.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run("disable")}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {pending ? "Disabling…" : "Disable"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirm(null)}
                  className="flex-1 rounded-lg border border-black/15 bg-white px-3 py-2 font-semibold text-zinc-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" disabled={pending} onClick={() => run("unpublish")} className={secondaryButton}>
                {pending ? "Working…" : "Unpublish"}
              </button>
              <button type="button" disabled={pending} onClick={() => setConfirm("disable")} className={secondaryButton}>
                Disable
              </button>
            </div>
          ))}

        {exhibit.status === "DISABLED" && (
          <p className="rounded-lg bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
            This exhibit is disabled and cannot be published again. Archive it if it is no longer needed.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={qrBusy !== null}
            onClick={() => qrFile("label", "print")}
            title="Print the exhibit label: QR code, specimen name, and public URL."
            className={secondaryButton}
          >
            <PrinterIcon className="h-4 w-4" />
            {qrBusy === "print" ? "Preparing…" : "Print Label"}
          </button>
          <button
            type="button"
            disabled={qrBusy !== null}
            onClick={() => qrFile("qr-png", "download")}
            className={secondaryButton}
          >
            <DownloadIcon className="h-4 w-4" />
            {qrBusy === "qr-png" ? "Preparing…" : "Download QR"}
          </button>
        </div>
        <p className="text-center text-[11px] text-zinc-500">
          Also as{" "}
          <button
            type="button"
            disabled={qrBusy !== null}
            onClick={() => qrFile("qr-svg", "download")}
            className="font-semibold text-forest-700 underline hover:text-forest-800 disabled:text-zinc-400"
          >
            QR (SVG)
          </button>{" "}
          or{" "}
          <button
            type="button"
            disabled={qrBusy !== null}
            onClick={() => qrFile("label", "download")}
            className="font-semibold text-forest-700 underline hover:text-forest-800 disabled:text-zinc-400"
          >
            label (SVG)
          </button>
          {exhibit.status !== "PUBLISHED" && ". The QR code only opens a page once the exhibit is published."}
        </p>

        <button
          type="button"
          onClick={() => onEdit(exhibit.id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-forest-700 px-4 py-2.5 text-sm font-semibold text-forest-700 hover:bg-forest-50"
        >
          <PencilIcon className="h-4 w-4" />
          Edit Exhibit
        </button>

        {confirm === "archive" ? (
          <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <p>
              Archive this exhibit? Its public page and QR code stop working, and it leaves this list. The record is kept
              for the audit history.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => run("archive")}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {pending ? "Archiving…" : "Archive"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirm(null)}
                className="flex-1 rounded-lg border border-black/15 bg-white px-3 py-2 font-semibold text-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm("archive")}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <ArchiveIcon className="h-4 w-4" />
            Archive Exhibit
          </button>
        )}
      </div>
    </div>
  );
}
