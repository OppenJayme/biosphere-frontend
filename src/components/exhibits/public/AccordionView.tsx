"use client";

import { Fragment, useId, useState, type ReactNode } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BookOpenIcon,
  LayersIcon,
  ArchiveIcon,
  InfoIcon,
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

function ThumbnailCarousel({ images, alt, dark }: { images: PublicImage[]; alt: string; dark: boolean }) {
  const [index, setIndex] = useState(0);
  const count = images.length;

  return (
    <div className="space-y-2.5">
      <div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-black/20">
        <ImageStack images={images} index={index} alt={alt} dark={dark} />
      </div>
      {count > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
            aria-label="Previous photo"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/20 text-white/80 hover:bg-black/30"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <div className="grid flex-1 grid-cols-4 gap-2">
            {images.slice(0, 4).map((image, i) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1} of ${count}`}
                aria-current={i === index}
                className={`relative aspect-square overflow-hidden rounded-lg ${
                  i === index ? "ring-2 ring-emerald-400" : "opacity-70"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % count)}
            aria-label="Next photo"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/20 text-white/80 hover:bg-black/30"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

type Section = { id: string; title: string; icon: typeof InfoIcon; content: ReactNode };

function Detail({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <p>
      <span className="font-semibold">{label}: </span>
      {value}
    </p>
  );
}

export function AccordionView({ exhibit, dark }: { exhibit: PublicExhibit; dark: boolean }) {
  const name = exhibitName(exhibit);
  const taxonomy = taxonomyRows(exhibit);
  const facts = exhibitFacts(exhibit);
  const tags = exhibitTags(exhibit);
  const baseId = useId();

  const sections: Section[] = [];
  if (exhibit.publicDescription) {
    sections.push({
      id: "description",
      title: "Description",
      icon: BookOpenIcon,
      content: <p className="whitespace-pre-line text-sm leading-relaxed">{exhibit.publicDescription}</p>,
    });
  }
  if (taxonomy.length > 0) {
    sections.push({
      id: "classification",
      title: "Classification",
      icon: LayersIcon,
      content: (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {taxonomy.map(({ rank, value }) => (
            <Fragment key={rank}>
              <dt className={`capitalize ${dark ? "text-white/40" : "text-zinc-400"}`}>{rank}</dt>
              <dd className="break-words">{value}</dd>
            </Fragment>
          ))}
        </dl>
      ),
    });
  }
  if (exhibit.habitat || exhibit.distribution || exhibit.diet) {
    sections.push({
      id: "habitat",
      title: "Habitat & Distribution",
      icon: ArchiveIcon,
      content: (
        <div className="space-y-2 text-sm">
          <Detail label="Habitat" value={exhibit.habitat} />
          <Detail label="Distribution" value={exhibit.distribution} />
          <Detail label="Diet" value={exhibit.diet} />
        </div>
      ),
    });
  }
  if (exhibit.ecologicalRole || exhibit.conservationStatus) {
    sections.push({
      id: "ecology",
      title: "Ecology & Conservation",
      icon: InfoIcon,
      content: (
        <div className="space-y-2 text-sm">
          <Detail label="Ecological role" value={exhibit.ecologicalRole} />
          <Detail label="Conservation status" value={exhibit.conservationStatus} />
        </div>
      ),
    });
  }
  if (facts.length > 0) {
    sections.push({
      id: "fun-facts",
      title: "Interesting Facts",
      icon: SparkleIcon,
      content: (
        <ul className="space-y-1.5 text-sm">
          {facts.map((fact) => (
            <li key={fact} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />
              {fact}
            </li>
          ))}
        </ul>
      ),
    });
  }

  const [openId, setOpenId] = useState<string>(sections[0]?.id ?? "");

  return (
    <div className="space-y-5">
      <ThumbnailCarousel images={exhibitImages(exhibit)} alt={name} dark={dark} />

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

      <div className="space-y-2.5">
        {sections.map((section) => {
          const open = openId === section.id;
          const panelId = `${baseId}-${section.id}`;
          return (
            <div
              key={section.id}
              className={`overflow-hidden rounded-xl border ${dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}
            >
              <h2>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? "" : section.id)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className={`flex w-full items-center gap-2.5 px-4 py-3.5 text-left text-sm font-semibold ${
                    dark ? "text-emerald-300" : "text-forest-700"
                  }`}
                >
                  <section.icon className="h-4 w-4 shrink-0" />
                  {section.title}
                  <ChevronDownIcon className={`ml-auto h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
              </h2>
              <div
                id={panelId}
                hidden={!open}
                className={`border-t px-4 py-3.5 ${dark ? "border-white/10 text-white/80" : "border-black/5 text-zinc-700"}`}
              >
                {section.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
