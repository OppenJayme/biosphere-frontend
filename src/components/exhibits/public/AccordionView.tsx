"use client";

import { useState, type ReactNode } from "react";
import { ChevronDownIcon, BookOpenIcon, ArchiveIcon, SparkleIcon } from "@/components/icons";
import { splitFacts, type PublicExhibit } from "@/features/exhibits-qr/types";
import { ExhibitImages } from "./ExhibitImages";

type Section = { id: string; title: string; icon: typeof BookOpenIcon; content: ReactNode };

/** Accordion layout. Sections the curator left blank are not shown. */
export function AccordionView({ exhibit, title, dark }: { exhibit: PublicExhibit; title: string; dark: boolean }) {
  const facts = splitFacts(exhibit.interestingFacts);

  const sections: Section[] = [];
  if (exhibit.publicDescription) {
    sections.push({
      id: "description",
      title: "Description",
      icon: BookOpenIcon,
      content: <p className="text-sm leading-relaxed whitespace-pre-line">{exhibit.publicDescription}</p>,
    });
  }
  if (exhibit.distribution || exhibit.diet) {
    sections.push({
      id: "distribution",
      title: "Distribution & Diet",
      icon: ArchiveIcon,
      content: (
        <div className="space-y-2 text-sm">
          {exhibit.distribution && (
            <p>
              <span className="font-semibold">Distribution: </span>
              {exhibit.distribution}
            </p>
          )}
          {exhibit.diet && (
            <p>
              <span className="font-semibold">Diet: </span>
              {exhibit.diet}
            </p>
          )}
        </div>
      ),
    });
  }
  if (facts.length > 0) {
    sections.push({
      id: "facts",
      title: "Interesting Facts",
      icon: SparkleIcon,
      content: (
        <ul className="space-y-1.5 text-sm">
          {facts.map((fact) => (
            <li key={fact} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />
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
      <ExhibitImages images={exhibit.media} alt={title} dark={dark} aspect="aspect-16/10" />

      <h1 className={`font-serif text-2xl font-semibold ${dark ? "text-white" : "text-zinc-900"}`}>{title}</h1>

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
                aria-expanded={open}
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
