"use client";

import { useActionState, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
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
  CubeIcon,
  ClockIcon,
  ImageIcon,
  ClipboardIcon,
  InfoIcon,
} from "@/components/icons";
import { ConfirmButton } from "@/components/ui/ConfirmButton";
import { changeExhibitStatusAction, setExhibitArAction } from "@/features/exhibits-qr/actions";
import { exhibitsHref, type ExhibitCommandState } from "@/features/exhibits-qr/form";
import { downloadExhibitFile, exhibitLabelUrl, exhibitQrUrl, printExhibitLabel } from "@/features/exhibits-qr/qr-client";
import { sortExhibitMedia, type Exhibit, type ExhibitListQuery } from "@/features/exhibits-qr/types";
import { formatTimestamp } from "@/features/public-submissions/format";
import { ExhibitStatusBadge, FormMessage } from "./ExhibitParts";

type Command = "publish" | "unpublish" | "disable" | "archive";

function Carousel({ exhibit }: { exhibit: Exhibit }) {
  const images = sortExhibitMedia(exhibit.media ?? []).filter((item) => item.previewUrl);
  const [index, setIndex] = useState(0);
  const alt = exhibit.specimen.commonName ?? "Exhibit image";

  if (images.length === 0) {
    return (
      <div className="flex aspect-4/3 flex-col items-center justify-center gap-1.5 rounded-lg bg-sage-100 text-center text-xs text-zinc-500">
        <ImageIcon className="h-6 w-6 text-zinc-400" />
        No exhibit images yet
      </div>
    );
  }

  const current = images[index % images.length];
  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-sage-100">
      {/* Signed, short-lived storage URLs: next/image would cache every new signature. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current.previewUrl ?? ""} alt={current.caption ?? alt} className="h-full w-full object-cover" />
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
            {(index % images.length) + 1}/{images.length}
          </span>
        </>
      )}
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
      <span className="flex shrink-0 items-center gap-1.5 text-zinc-500">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </span>
      <span className="min-w-0 text-right font-medium text-zinc-800">{children}</span>
    </div>
  );
}

const outlineButton =
  "flex items-center justify-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-sage-100 disabled:cursor-not-allowed disabled:opacity-60";

function QrSection({ exhibit }: { exhibit: Exhibit }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const slug = exhibit.publicSlug;

  async function run(key: string, task: () => Promise<void>) {
    setBusy(key);
    setMessage(null);
    try {
      await task();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The QR file could not be prepared.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section aria-labelledby="exhibit-qr-heading" className="space-y-2.5 border-t border-black/5 pt-3">
      <h4 id="exhibit-qr-heading" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        QR code &amp; label
      </h4>
      <div className="flex items-start gap-3">
        <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-black/10 bg-white">
          {previewFailed ? (
            <span className="px-2 text-center text-[11px] text-zinc-500">Preview unavailable</span>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={exhibitQrUrl(exhibit.id, "svg")}
              alt={`QR code for /exhibits/${slug}`}
              className="h-full w-full"
              onError={() => setPreviewFailed(true)}
            />
          )}
        </span>
        <p className="text-xs leading-relaxed text-zinc-500">
          The code always opens this exhibit&rsquo;s public URL. Reprinting gives the same code, and
          it works only while the exhibit is published.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("png", () => downloadExhibitFile(exhibitQrUrl(exhibit.id, "png", true), `${slug}-qr.png`))}
          className={outlineButton}
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          {busy === "png" ? "Preparing…" : "QR (PNG)"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("svg", () => downloadExhibitFile(exhibitQrUrl(exhibit.id, "svg", true), `${slug}-qr.svg`))}
          className={outlineButton}
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          {busy === "svg" ? "Preparing…" : "QR (SVG)"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("print", () => printExhibitLabel(exhibit.id))}
          className={outlineButton}
        >
          <PrinterIcon className="h-3.5 w-3.5" />
          {busy === "print" ? "Preparing…" : "Print label"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("label", () => downloadExhibitFile(exhibitLabelUrl(exhibit.id, true), `${slug}-label.svg`))}
          className={outlineButton}
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          {busy === "label" ? "Preparing…" : "Label (SVG)"}
        </button>
      </div>
      {message && (
        <p role="alert" className="text-xs font-medium text-red-700">
          {message}
        </p>
      )}
    </section>
  );
}

function LifecycleButton({
  exhibit,
  query,
  command,
  label,
  question,
  detail,
  confirmLabel,
  danger = false,
  primary = false,
}: {
  exhibit: Exhibit;
  query: ExhibitListQuery;
  command: Command;
  label: string;
  question: string;
  detail: string;
  confirmLabel: string;
  danger?: boolean;
  primary?: boolean;
}) {
  const action = changeExhibitStatusAction.bind(null, exhibit.id, exhibit.publicSlug, command, query);
  const [state, formAction, pending] = useActionState<ExhibitCommandState, FormData>(action, {});

  return (
    <form action={formAction} className="contents">
      <ConfirmButton
        label={label}
        question={question}
        detail={detail}
        confirmLabel={confirmLabel}
        tone={danger ? "danger" : "default"}
        pending={pending}
        pendingLabel="Updating exhibit…"
        className={`w-full rounded-lg px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
          primary
            ? "bg-forest-700 text-white hover:bg-forest-800"
            : danger
              ? "border border-red-200 text-red-700 hover:bg-red-50"
              : "border border-forest-700 text-forest-800 hover:bg-forest-50"
        }`}
      />
      {state.message && (
        <span className="col-span-full">
          <FormMessage message={state.message} />
        </span>
      )}
    </form>
  );
}

function LifecycleSection({ exhibit, query }: { exhibit: Exhibit; query: ExhibitListQuery }) {
  const name = exhibit.specimen.commonName ?? "this exhibit";
  const archive = (
    <LifecycleButton
      exhibit={exhibit}
      query={query}
      command="archive"
      label="Archive"
      danger
      question={`Archive the ${name} exhibit?`}
      detail="Archiving is final. The exhibit leaves this list, its QR code and URL stop working, and its QR code and label can no longer be generated. The specimen record is not changed."
      confirmLabel="Yes, archive"
    />
  );

  return (
    <section aria-labelledby="exhibit-lifecycle-heading" className="space-y-2.5 border-t border-black/5 pt-3">
      <h4 id="exhibit-lifecycle-heading" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Publishing
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {exhibit.status !== "PUBLISHED" && (
          <LifecycleButton
            exhibit={exhibit}
            query={query}
            command="publish"
            primary
            label={exhibit.status === "DISABLED" ? "Re-publish" : "Publish"}
            question={`Publish the ${name} exhibit?`}
            detail="Visitors who scan its QR code or open its URL will see the approved content and images. The specimen must still be Cataloged and approved for public display."
            confirmLabel="Yes, publish"
          />
        )}
        {exhibit.status === "PUBLISHED" && (
          <>
            <LifecycleButton
              exhibit={exhibit}
              query={query}
              command="unpublish"
              label="Unpublish"
              question={`Unpublish the ${name} exhibit?`}
              detail="The public page goes offline and its QR code shows an unavailable message. You can edit it and publish it again later."
              confirmLabel="Yes, unpublish"
            />
            <LifecycleButton
              exhibit={exhibit}
              query={query}
              command="disable"
              danger
              label="Disable"
              question={`Disable the ${name} exhibit?`}
              detail="Use this when the exhibit must be taken down (for example, the specimen is off display). Its QR code shows an unavailable message until you re-publish it."
              confirmLabel="Yes, disable"
            />
          </>
        )}
        {archive}
      </div>
    </section>
  );
}

function ArSection({ exhibit, query }: { exhibit: Exhibit; query: ExhibitListQuery }) {
  const enable = !exhibit.arEnabled;
  const action = setExhibitArAction.bind(null, exhibit.id, exhibit.publicSlug, enable, query);
  const [state, formAction, pending] = useActionState<ExhibitCommandState, FormData>(action, {});
  const hasModel = exhibit.arAssetCount > 0;
  const models = `${exhibit.arAssetCount} AR model file${exhibit.arAssetCount === 1 ? "" : "s"} uploaded`;

  return (
    <section aria-labelledby="exhibit-ar-heading" className="space-y-2.5 border-t border-black/5 pt-3">
      <h4 id="exhibit-ar-heading" className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        WebAR
      </h4>
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs text-zinc-600">
          <p className="font-semibold text-zinc-900">{exhibit.arEnabled ? "AR is on" : "AR is off"}</p>
          <p className="mt-0.5">{hasModel ? models : "No AR model uploaded yet"}</p>
        </div>
        <form action={formAction}>
          <ConfirmButton
            label={enable ? "Turn AR on" : "Turn AR off"}
            question={enable ? "Turn on View in AR?" : "Turn off View in AR?"}
            detail={
              enable
                ? "Visitors on a published page with a supported device will see View in AR. Everyone else keeps the normal page."
                : "The View in AR action is hidden right away. The model files are kept, so you can turn AR back on without a new upload."
            }
            confirmLabel={enable ? "Yes, turn on" : "Yes, turn off"}
            disabled={enable && !hasModel}
            describedBy={!hasModel ? "exhibit-ar-help" : undefined}
            pending={pending}
            pendingLabel="Updating AR…"
            className="shrink-0 rounded-lg border border-forest-700 px-3 py-1.5 text-xs font-semibold text-forest-800 hover:bg-forest-50 disabled:cursor-not-allowed disabled:border-black/10 disabled:text-zinc-400 disabled:hover:bg-transparent"
          />
        </form>
      </div>
      {!hasModel && (
        <p id="exhibit-ar-help" className="flex gap-1.5 rounded-lg bg-sage-50 px-3 py-2 text-xs text-zinc-600">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
          A developer uploads and validates AR models. Once a model is uploaded for this exhibit, you
          can turn AR on here.
        </p>
      )}
      <FormMessage message={state.message} />
    </section>
  );
}

function CopyUrl({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-forest-700 hover:underline"
    >
      <ClipboardIcon className="h-3 w-3" />
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}

export function ExhibitDetailPanel({
  exhibit,
  query,
  selectedError,
}: {
  exhibit: Exhibit | null;
  query: ExhibitListQuery;
  selectedError?: string;
}) {
  if (!exhibit) {
    return (
      <div className="rounded-xl border border-black/10 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900">Selected Exhibit</h3>
        {selectedError ? (
          <p role="alert" className="py-6 text-center text-xs font-medium text-red-700">
            {selectedError}
          </p>
        ) : (
          <p className="py-6 text-center text-xs text-zinc-500">
            Select an exhibit from the table to see its details here.
          </p>
        )}
      </div>
    );
  }

  const published = exhibit.status === "PUBLISHED";

  return (
    <div className="space-y-4 rounded-xl border border-black/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900">Selected Exhibit</h3>
        <Link href={exhibitsHref(query)} scroll={false} aria-label="Clear selection" className="text-zinc-400 hover:text-zinc-600">
          <CloseIcon className="h-4 w-4" />
        </Link>
      </div>

      <Carousel key={exhibit.id} exhibit={exhibit} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">{exhibit.specimen.commonName ?? "Unnamed specimen"}</p>
          <p className="text-xs italic text-zinc-500">{exhibit.specimen.scientificName ?? "—"}</p>
        </div>
        <ExhibitStatusBadge status={exhibit.status} />
      </div>

      <div className="divide-y divide-black/5 border-t border-black/5">
        <InfoRow icon={LinkIcon} label="Public URL">
          <span className="block break-all font-mono text-[11px] font-normal text-zinc-700">
            {exhibit.publicUrl ?? `/exhibits/${exhibit.publicSlug}`}
          </span>
          {exhibit.publicUrl ? (
            <CopyUrl url={exhibit.publicUrl} />
          ) : (
            <span className="block text-[11px] font-normal text-amber-700">Public site address not configured</span>
          )}
        </InfoRow>
        <InfoRow icon={CubeIcon} label="AR">
          {exhibit.arEnabled ? "On" : exhibit.arAssetCount > 0 ? "Off" : "No model"}
        </InfoRow>
        <InfoRow icon={ClockIcon} label="Published">
          {exhibit.publishedAt ? formatTimestamp(exhibit.publishedAt) : "Never"}
        </InfoRow>
        <InfoRow icon={ClockIcon} label="Last updated">
          {formatTimestamp(exhibit.updatedAt)}
        </InfoRow>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {published ? (
          <a
            href={`/exhibits/${exhibit.publicSlug}`}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-2 rounded-lg border border-forest-700 px-3 py-2 text-xs font-semibold text-forest-700 hover:bg-forest-50"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            View public page
          </a>
        ) : (
          <span
            title="Only published exhibits have a public page"
            className="flex items-center justify-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-xs font-semibold text-zinc-400"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            Not public yet
          </span>
        )}
        <a
          href="#exhibit-editor"
          className="flex items-center justify-center gap-2 rounded-lg border border-forest-700 px-3 py-2 text-xs font-semibold text-forest-700 hover:bg-forest-50"
        >
          <PencilIcon className="h-3.5 w-3.5" />
          Edit exhibit
        </a>
      </div>

      <LifecycleSection exhibit={exhibit} query={query} />
      <QrSection exhibit={exhibit} />
      <ArSection exhibit={exhibit} query={query} />

    </div>
  );
}
