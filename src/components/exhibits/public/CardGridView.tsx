"use client";

import { useState, type ReactNode } from "react";
import { InfoIcon, MapPinIcon, ArchiveIcon, SparkleIcon } from "@/components/icons";
import { splitFacts, type PublicExhibit } from "@/features/exhibits-qr/types";
import { ExhibitImages } from "./ExhibitImages";

function ReadMoreText({ text, dark }: { text: string; dark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 160;

  return (
    <div>
      <p
        className={`text-sm leading-relaxed whitespace-pre-line ${dark ? "text-white/80" : "text-zinc-700"} ${
          !expanded && long ? "line-clamp-2" : ""
        }`}
      >
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
    <p
      className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${
        dark ? "text-emerald-300" : "text-forest-700"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </p>
  );
}

function Card({ dark, children }: { dark: boolean; children: ReactNode }) {
  return (
    <div className={`rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/5" : "border-black/10 bg-white"}`}>
      {children}
    </div>
  );
}

/** Card layout. Sections the curator left blank are not shown. */
export function CardGridView({ exhibit, title, dark }: { exhibit: PublicExhibit; title: string; dark: boolean }) {
  const facts = splitFacts(exhibit.interestingFacts);
  const text = dark ? "text-white/80" : "text-zinc-700";

  return (
    <div className="space-y-5">
      <ExhibitImages images={exhibit.media} alt={title} dark={dark} />

      <h1 className={`font-serif text-2xl font-semibold ${dark ? "text-white" : "text-zinc-900"}`}>{title}</h1>

      {exhibit.publicDescription && (
        <Card dark={dark}>
          <SectionLabel icon={InfoIcon} dark={dark}>
            About This Specimen
          </SectionLabel>
          <div className="mt-2">
            <ReadMoreText text={exhibit.publicDescription} dark={dark} />
          </div>
        </Card>
      )}

      {(exhibit.distribution || exhibit.diet) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {exhibit.distribution && (
            <Card dark={dark}>
              <SectionLabel icon={MapPinIcon} dark={dark}>
                Distribution
              </SectionLabel>
              <p className={`mt-2 text-sm ${text}`}>{exhibit.distribution}</p>
            </Card>
          )}
          {exhibit.diet && (
            <Card dark={dark}>
              <SectionLabel icon={ArchiveIcon} dark={dark}>
                Diet
              </SectionLabel>
              <p className={`mt-2 text-sm ${text}`}>{exhibit.diet}</p>
            </Card>
          )}
        </div>
      )}

      {facts.length > 0 && (
        <Card dark={dark}>
          <SectionLabel icon={SparkleIcon} dark={dark}>
            Interesting Facts
          </SectionLabel>
          <ul className={`mt-2 space-y-1.5 text-sm ${text}`}>
            {facts.map((fact) => (
              <li key={fact} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />
                {fact}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
