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
} from "@/components/icons";
import {
  changeExhibitStatusAction,
  loadExhibitMediaAction,
  type ExhibitMediaResult,
} from "@/features/exhibits-qr/actions";
import type { ExhibitLifecycleCommand } from "@/features/exhibits-qr/api";
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
  const [confirmArchive, setConfirmArchive] = useState(false);
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
      setConfirmArchive(false);
    });
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
          /exhibits/{exhibit.publicSlug}
        </InfoRow>
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

        {exhibit.status === "PUBLISHED" ? (
          <button type="button" disabled={pending} onClick={() => run("disable")} className={`${secondaryButton} w-full`}>
            {pending ? "Working…" : "Disable Public Page"}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("publish")}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800 disabled:opacity-50"
          >
            {pending ? "Working…" : exhibit.status === "DISABLED" ? "Re-publish Exhibit" : "Publish Exhibit"}
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled title="QR downloads are not available from the backend yet." className={secondaryButton}>
            <PrinterIcon className="h-4 w-4" />
            Print QR
          </button>
          <button type="button" disabled title="QR downloads are not available from the backend yet." className={secondaryButton}>
            <DownloadIcon className="h-4 w-4" />
            Download QR
          </button>
        </div>

        <button
          type="button"
          onClick={() => onEdit(exhibit.id)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-forest-700 px-4 py-2.5 text-sm font-semibold text-forest-700 hover:bg-forest-50"
        >
          <PencilIcon className="h-4 w-4" />
          Edit Exhibit
        </button>

        {confirmArchive ? (
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
                onClick={() => setConfirmArchive(false)}
                className="flex-1 rounded-lg border border-black/15 bg-white px-3 py-2 font-semibold text-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmArchive(true)}
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
