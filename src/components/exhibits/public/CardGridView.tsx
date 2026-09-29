"use client";

import { Fragment, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  InfoIcon,
  LayersIcon,
  ArchiveIcon,
  ShieldIcon,
  MapPinIcon,
  SparkleIcon,
} from "@/components/icons";
import type { PublicExhibit } from "@/features/exhibits-qr/types";
import {
  exhibitFacts,
  exhibitImages,
  exhibitName,
  exhibitTags,
  ImageStack,
  taxonomyRows,
  type PublicImage,
} from "./exhibit-content";

function HeroCarousel({ images, alt, dark }: { images: PublicImage[]; alt: string; dark: boolean }) {
  const [index, setIndex] = useState(0);

  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-black/20">
      <ImageStack images={images} index={index} alt={alt} dark={dark} />
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
      <p className={`whitespace-pre-line text-sm leading-relaxed ${dark ? "text-white/80" : "text-zinc-700"} ${!expanded && long ? "line-clamp-2" : ""}`}>
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
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
    <h2 className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${dark ? "text-emerald-300" : "text-forest-700"}`}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </h2>
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
  value: string | null;
  dark: boolean;
}) {
  if (!value) return null;
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

export function CardGridView({ exhibit, dark }: { exhibit: PublicExhibit; dark: boolean }) {
  const name = exhibitName(exhibit);
  const taxonomy = taxonomyRows(exhibit);
  const facts = exhibitFacts(exhibit);
  const tags = exhibitTags(exhibit);
  const hasEcology = [exhibit.habitat, exhibit.ecologicalRole, exhibit.conservationStatus, exhibit.distribution, exhibit.diet].some(Boolean);
  const card = `rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`;

  return (
    <div className="space-y-5">
      <HeroCarousel images={exhibitImages(exhibit)} alt={name} dark={dark} />

      <div>
        <h1 className={`font-serif text-2xl font-semibold ${dark ? "text-white" : "text-zinc-900"}`}>{name}</h1>
        {exhibit.scientificName && exhibit.scientificName !== name && (
          <p className={`text-sm italic ${dark ? "text-white/60" : "text-zinc-500"}`}>{exhibit.scientificName}</p>
        )}
        {tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-forest-700 px-3 py-1 text-xs font-medium text-white">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {exhibit.publicDescription && (
        <section className={card}>
          <SectionLabel icon={InfoIcon} dark={dark}>
            About This Specimen
          </SectionLabel>
          <div className="mt-2">
            <ReadMoreText text={exhibit.publicDescription} dark={dark} />
          </div>
        </section>
      )}

      {(taxonomy.length > 0 || hasEcology) && (
        <div className={`grid gap-4 ${taxonomy.length > 0 && hasEcology ? "grid-cols-2" : "grid-cols-1"}`}>
          {taxonomy.length > 0 && (
            <section className={card}>
              <SectionLabel icon={LayersIcon} dark={dark}>
                Classification
              </SectionLabel>
              <dl className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2.5 text-sm">
                {taxonomy.map(({ rank, value }) => (
                  <Fragment key={rank}>
                    <dt className={`capitalize ${dark ? "text-white/40" : "text-zinc-400"}`}>{rank}</dt>
                    <dd className={`break-words ${dark ? "text-white/85" : "text-zinc-800"}`}>{value}</dd>
                  </Fragment>
                ))}
              </dl>
            </section>
          )}

          {hasEcology && (
            <div className="space-y-3.5">
              <EcologyFact icon={ArchiveIcon} label="Habitat" value={exhibit.habitat} dark={dark} />
              <EcologyFact icon={InfoIcon} label="Ecological Role" value={exhibit.ecologicalRole} dark={dark} />
              <EcologyFact icon={ShieldIcon} label="Conservation Status" value={exhibit.conservationStatus} dark={dark} />
              <EcologyFact icon={MapPinIcon} label="Distribution" value={exhibit.distribution} dark={dark} />
              <EcologyFact icon={ArchiveIcon} label="Diet" value={exhibit.diet} dark={dark} />
            </div>
          )}
        </div>
      )}

      {facts.length > 0 && (
        <section className={card}>
          <SectionLabel icon={SparkleIcon} dark={dark}>
            Interesting Facts
          </SectionLabel>
          <ul className={`mt-2 space-y-1.5 text-sm ${dark ? "text-white/80" : "text-zinc-700"}`}>
            {facts.map((fact) => (
              <li key={fact} className="flex gap-2">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />
                {fact}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
