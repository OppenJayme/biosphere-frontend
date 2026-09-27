"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { PublicExhibit } from "@/features/exhibits-qr/types";

function HeroCarousel({ exhibit, alt }: { exhibit: PublicExhibit; alt: string }) {
  const [index, setIndex] = useState(0);
  const media = [...exhibit.media].sort((left, right) => left.displayOrder - right.displayOrder);

  if (media.length === 0) {
    return (
      <div className="flex aspect-4/3 items-center justify-center rounded-2xl border border-black/10 bg-white text-sm text-zinc-500">
        Exhibit photos are not available.
      </div>
    );
  }

  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-black/20">
      <Image src={media[index].mediaUrl} alt={media[index].caption || alt} fill sizes="640px" priority unoptimized className="object-cover" />
      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + media.length) % media.length)}
            aria-label="Previous photo"
            className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % media.length)}
            aria-label="Next photo"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
            {index + 1}/{media.length}
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

function SectionLabel({ children, dark }: { children: string; dark: boolean }) {
  return (
    <p className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${dark ? "text-emerald-300" : "text-forest-700"}`}>
      {children}
    </p>
  );
}

function PublicFact({
  label,
  value,
  dark,
}: {
  label: string;
  value: string;
  dark: boolean;
}) {
  return (
    <div>
      <p className={`text-xs font-semibold ${dark ? "text-emerald-300" : "text-forest-700"}`}>
        {label}
      </p>
      <p className={`mt-0.5 text-sm ${dark ? "text-white/80" : "text-zinc-700"}`}>{value}</p>
    </div>
  );
}

export function CardGridView({ exhibit, dark }: { exhibit: PublicExhibit; dark: boolean }) {
  const title = exhibit.publicSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const facts = (exhibit.interestingFacts ?? "")
    .split(/\r?\n/)
    .map((fact) => fact.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5">
      <HeroCarousel exhibit={exhibit} alt={title} />

      <div>
        <p className={`text-xs font-semibold uppercase ${dark ? "text-emerald-300" : "text-forest-700"}`}>Online exhibit</p>
        <h1 className={`mt-1 font-serif text-2xl font-semibold ${dark ? "text-white" : "text-zinc-900"}`}>{title}</h1>
      </div>

      {exhibit.publicDescription && (
        <div className={`rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
          <SectionLabel dark={dark}>About This Exhibit</SectionLabel>
          <div className="mt-2">
            <ReadMoreText text={exhibit.publicDescription} dark={dark} />
          </div>
        </div>
      )}

      {(exhibit.distribution || exhibit.diet) && (
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${dark ? "text-white/80" : "text-zinc-700"}`}>
          {exhibit.distribution && <PublicFact label="Distribution" value={exhibit.distribution} dark={dark} />}
          {exhibit.diet && <PublicFact label="Diet" value={exhibit.diet} dark={dark} />}
        </div>
      )}

      {facts.length > 0 && (
        <section className={`rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
          <SectionLabel dark={dark}>Interesting Facts</SectionLabel>
          <ul className={`mt-3 list-disc space-y-2 pl-5 text-sm ${dark ? "text-white/80" : "text-zinc-700"}`}>
            {facts.map((fact) => <li key={fact}>{fact}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
