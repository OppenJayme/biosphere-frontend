"use client";

import { useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ExternalLinkIcon,
  PrinterIcon,
  DownloadIcon,
  PencilIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LinkIcon,
  QrCodeIcon,
  CubeIcon,
  MapPinIcon,
  ClockIcon,
} from "@/components/icons";
import type { Exhibit } from "@/lib/dummy-data/exhibits";

const PUBLISH_STYLES: Record<Exhibit["publishStatus"], string> = {
  Published: "bg-forest-100 text-forest-700",
  Draft: "bg-zinc-100 text-zinc-600",
  "Needs Review": "bg-amber-100 text-amber-700",
};

function Carousel({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);

  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-sage-100">
      <Image src={images[index]} alt={alt} fill sizes="320px" className="object-cover" />
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
      <span className="text-right font-medium text-zinc-800">{children}</span>
    </div>
  );
}

export function ExhibitDetailPanel({
  exhibit,
  onClear,
}: {
  exhibit: Exhibit | null;
  onClear: () => void;
}) {
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

      <Carousel images={exhibit.images} alt={exhibit.commonName} />

      <div>
        <p className="text-sm font-semibold text-zinc-900">{exhibit.commonName}</p>
        <p className="text-xs italic text-zinc-500">{exhibit.scientificName}</p>
      </div>

      <div className="divide-y divide-black/5 border-t border-black/5">
        <InfoRow icon={LinkIcon} label="Public Slug">
          {exhibit.slug}
        </InfoRow>
        <InfoRow icon={QrCodeIcon} label="QR Status">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              exhibit.qrEnabled ? "bg-forest-100 text-forest-700" : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {exhibit.qrEnabled ? "QR Enabled" : "Not Generated"}
          </span>
        </InfoRow>
        <InfoRow icon={CubeIcon} label="AR Availability">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
              exhibit.arEnabled ? "bg-forest-100 text-forest-700" : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {exhibit.arEnabled ? "AR Available" : "No AR"}
          </span>
        </InfoRow>
        <InfoRow icon={PencilIcon} label="Publish Status">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${PUBLISH_STYLES[exhibit.publishStatus]}`}>
            {exhibit.publishStatus}
          </span>
        </InfoRow>
        <InfoRow icon={ClockIcon} label="Last Updated">
          <span className="block">
            {exhibit.updatedAt}
            <br />
            {exhibit.updatedBy}
          </span>
        </InfoRow>
        <InfoRow icon={MapPinIcon} label="Primary Location">
          {exhibit.primaryLocation}
        </InfoRow>
      </div>

      <div className="space-y-2 pt-1">
        {exhibit.publishStatus === "Published" ? (
          <Link
            href={`/exhibits/${exhibit.slug}`}
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
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-black/10 px-4 py-2.5 text-sm font-semibold text-zinc-400"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Preview Public Page
          </button>
        )}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
          >
            <PrinterIcon className="h-4 w-4" />
            Print QR
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg border border-black/15 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-sage-100"
          >
            <DownloadIcon className="h-4 w-4" />
            Download QR
          </button>
        </div>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-forest-700 px-4 py-2.5 text-sm font-semibold text-forest-700 hover:bg-forest-50"
        >
          <PencilIcon className="h-4 w-4" />
          Edit Exhibit
        </button>
      </div>
    </div>
  );
}
