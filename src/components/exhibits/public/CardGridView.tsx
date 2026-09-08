"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  LayersIcon,
  ArchiveIcon,
  ShieldIcon,
  MapPinIcon,
} from "@/components/icons";
import type { Exhibit } from "@/lib/dummy-data/exhibits";

function HeroCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);

  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-black/20">
      <Image src={images[index]} alt={alt} fill sizes="640px" priority className="object-cover" />
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
            {index + 1}/{images.length}
          </span>
        </>
      )}
    </div>
  );
}

function ReadMoreText({ text, dark }: { text: string; dark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 160;

  return (
    <div>
      <p className={`text-sm leading-relaxed ${dark ? "text-white/80" : "text-zinc-700"} ${!expanded && long ? "line-clamp-2" : ""}`}>
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={`mt-1.5 text-xs font-semibold uppercase tracking-wide ${dark ? "text-emerald-300" : "text-forest-700"}`}
        >
          {expanded ? "Read Less ▲" : "Read More ▼"}
        </button>
      )}
    </div>
  );
}

function SectionLabel({ icon: Icon, children, dark }: { icon: typeof InfoIcon; children: string; dark: boolean }) {
  return (
    <p className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${dark ? "text-emerald-300" : "text-forest-700"}`}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </p>
  );
}

function EcologyFact({
  icon: Icon,
  label,
  value,
  dark,
}: {
  icon: typeof ArchiveIcon;
  label: string;
  value: string;
  dark: boolean;
}) {
  return (
    <div>
      <p className={`flex items-center gap-1.5 text-xs font-semibold ${dark ? "text-emerald-300" : "text-forest-700"}`}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className={`mt-0.5 text-sm ${dark ? "text-white/80" : "text-zinc-700"}`}>{value}</p>
    </div>
  );
}

export function CardGridView({ exhibit, dark }: { exhibit: Exhibit; dark: boolean }) {
  return (
    <div className="space-y-5">
      <HeroCarousel images={exhibit.images} alt={exhibit.commonName} />

      <div>
        <h1 className={`font-serif text-2xl font-semibold ${dark ? "text-white" : "text-zinc-900"}`}>{exhibit.commonName}</h1>
        <p className={`text-sm italic ${dark ? "text-white/60" : "text-zinc-500"}`}>{exhibit.scientificName}</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {exhibit.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-forest-700 px-3 py-1 text-xs font-medium text-white">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className={`rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
        <SectionLabel icon={InfoIcon} dark={dark}>
          About This Specimen
        </SectionLabel>
        <div className="mt-2">
          <ReadMoreText text={exhibit.description} dark={dark} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
          <SectionLabel icon={LayersIcon} dark={dark}>
            Classification
          </SectionLabel>
          <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2.5 text-sm">
            {Object.entries(exhibit.taxonomy).map(([label, value]) => (
              <Fragment key={label}>
                <dt className={`capitalize ${dark ? "text-white/40" : "text-zinc-400"}`}>{label}</dt>
                <dd className={dark ? "text-white/85" : "text-zinc-800"}>{value}</dd>
              </Fragment>
            ))}
          </div>
        </div>

        <div className="space-y-3.5">
          <EcologyFact icon={ArchiveIcon} label="Habitat" value={exhibit.habitat} dark={dark} />
          <EcologyFact icon={InfoIcon} label="Ecological Role" value={exhibit.ecologicalRole} dark={dark} />
          <EcologyFact icon={ShieldIcon} label="Conservation Status" value={exhibit.conservationStatus} dark={dark} />
          <EcologyFact icon={MapPinIcon} label="Distribution" value={exhibit.distribution} dark={dark} />
          <EcologyFact icon={ArchiveIcon} label="Diet" value={exhibit.diet} dark={dark} />
        </div>
      </div>
    </div>
  );
}
