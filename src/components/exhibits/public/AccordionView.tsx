"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { PublicExhibit } from "@/features/exhibits-qr/types";

export function AccordionView({ exhibit, dark }: { exhibit: PublicExhibit; dark: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [openSection, setOpenSection] = useState("description");
  const title = exhibit.publicSlug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  const media = [...exhibit.media].sort((left, right) => left.displayOrder - right.displayOrder);
  const facts = (exhibit.interestingFacts ?? "")
    .split(/\r?\n/)
    .map((fact) => fact.trim())
    .filter(Boolean);
  const sections = [
    ...(exhibit.publicDescription
      ? [{ id: "description", title: "Description", content: exhibit.publicDescription }]
      : []),
    ...(exhibit.distribution ? [{ id: "distribution", title: "Distribution", content: exhibit.distribution }] : []),
    ...(exhibit.diet ? [{ id: "diet", title: "Diet", content: exhibit.diet }] : []),
    ...(facts.length > 0 ? [{ id: "facts", title: "Interesting Facts", content: facts.join("\n") }] : []),
  ];

  return (
    <div className="space-y-5">
      {media.length > 0 ? (
        <div className="space-y-2.5">
          <div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-black/20">
            <Image
              src={media[activeIndex].mediaUrl}
              alt={media[activeIndex].caption || title}
              fill
              sizes="640px"
              priority
              unoptimized
              className="object-cover"
            />
          </div>
          {media.length > 1 && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveIndex((index) => (index - 1 + media.length) % media.length)}
                aria-label="Previous photo"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-800 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="text-xs text-zinc-500">{activeIndex + 1} of {media.length}</span>
              <button
                type="button"
                onClick={() => setActiveIndex((index) => (index + 1) % media.length)}
                aria-label="Next photo"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-800 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex aspect-16/10 items-center justify-center rounded-2xl border border-black/10 bg-white text-sm text-zinc-500">
          Exhibit photos are not available.
        </div>
      )}

      <div>
        <p className={`text-xs font-semibold uppercase ${dark ? "text-emerald-300" : "text-forest-700"}`}>Online exhibit</p>
        <h1 className={`mt-1 font-serif text-2xl font-semibold ${dark ? "text-white" : "text-zinc-900"}`}>{title}</h1>
      </div>

      <div className="space-y-2.5">
        {sections.length > 0 ? sections.map((section) => {
          const expanded = openSection === section.id;
          return (
            <section
              key={section.id}
              className={`overflow-hidden rounded-xl border ${dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}
            >
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpenSection(expanded ? "" : section.id)}
                className={`flex min-h-12 w-full items-center gap-2.5 px-4 py-3.5 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-forest-700 ${dark ? "text-emerald-300" : "text-forest-700"}`}
              >
                {section.title}
                <ChevronDownIcon className={`ml-auto h-4 w-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded && (
                <div className={`whitespace-pre-line border-t px-4 py-3.5 text-sm leading-relaxed ${dark ? "border-white/10 text-white/80" : "border-black/5 text-zinc-700"}`}>
                  {section.content}
                </div>
              )}
            </section>
          );
        }) : (
          <p className={`rounded-xl border p-4 text-sm ${dark ? "border-white/10 text-white/70" : "border-black/10 text-zinc-600"}`}>
            Public information for this exhibit has not been added yet.
          </p>
        )}
      </div>
    </div>
  );
}
