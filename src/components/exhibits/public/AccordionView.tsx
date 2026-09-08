"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
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
import type { Exhibit } from "@/lib/dummy-data/exhibits";

function ThumbnailCarousel({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const strip = images.length > 1 ? images : [images[0], images[0], images[0], images[0]];

  return (
    <div className="space-y-2.5">
      <div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-black/20">
        <Image src={images[index % images.length]} alt={alt} fill sizes="640px" priority className="object-cover" />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIndex((i) => (i - 1 + strip.length) % strip.length)}
          aria-label="Previous photo"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/20 text-white/80 hover:bg-black/30"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <div className="grid flex-1 grid-cols-4 gap-2">
          {strip.slice(0, 4).map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative aspect-square overflow-hidden rounded-lg ${
                i === index % strip.length ? "ring-2 ring-emerald-400" : "opacity-70"
              }`}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIndex((i) => (i + 1) % strip.length)}
          aria-label="Next photo"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/20 text-white/80 hover:bg-black/30"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function AccordionView({ exhibit, dark }: { exhibit: Exhibit; dark: boolean }) {
  const [openId, setOpenId] = useState<string>("description");

  const sections = [
    {
      id: "description",
      title: "Description",
      icon: BookOpenIcon,
      content: <p className="text-sm leading-relaxed">{exhibit.description}</p>,
    },
    {
      id: "classification",
      title: "Classification",
      icon: LayersIcon,
      content: (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          {Object.entries(exhibit.taxonomy).map(([label, value]) => (
            <Fragment key={label}>
              <dt className={`capitalize ${dark ? "text-white/40" : "text-zinc-400"}`}>{label}</dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
        </dl>
      ),
    },
    {
      id: "habitat",
      title: "Habitat & Distribution",
      icon: ArchiveIcon,
      content: (
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Habitat: </span>
            {exhibit.habitat}
          </p>
          <p>
            <span className="font-semibold">Distribution: </span>
            {exhibit.distribution}
          </p>
          <p>
            <span className="font-semibold">Diet: </span>
            {exhibit.diet}
          </p>
        </div>
      ),
    },
    {
      id: "ecology",
      title: "Ecological Role",
      icon: InfoIcon,
      content: (
        <p className="text-sm">
          {exhibit.ecologicalRole}. Conservation status:{" "}
          <span className="font-semibold">{exhibit.conservationStatus}</span>.
        </p>
      ),
    },
    {
      id: "fun-facts",
      title: "Fun Facts",
      icon: SparkleIcon,
      content: (
        <ul className="space-y-1.5 text-sm">
          {exhibit.funFacts.map((fact) => (
            <li key={fact} className="flex gap-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current" />
              {fact}
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <ThumbnailCarousel images={exhibit.images} alt={exhibit.commonName} />

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

      <div className="space-y-2.5">
        {sections.map((section) => {
          const open = openId === section.id;
          return (
            <div
              key={section.id}
              className={`overflow-hidden rounded-xl border ${dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}
            >
              <button
                type="button"
                onClick={() => setOpenId(open ? "" : section.id)}
                className={`flex w-full items-center gap-2.5 px-4 py-3.5 text-left text-sm font-semibold ${
                  dark ? "text-emerald-300" : "text-forest-700"
                }`}
              >
                <section.icon className="h-4 w-4 shrink-0" />
                {section.title}
                <ChevronDownIcon className={`ml-auto h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <div className={`border-t px-4 py-3.5 ${dark ? "border-white/10 text-white/80" : "border-black/5 text-zinc-700"}`}>
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
