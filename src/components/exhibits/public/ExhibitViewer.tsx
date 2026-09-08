"use client";

import { useState } from "react";
import { LogoMark } from "@/components/layout/LogoMark";
import { MoonIcon, SunIcon, CubeIcon } from "@/components/icons";
import { CardGridView } from "./CardGridView";
import { AccordionView } from "./AccordionView";
import { ArModal } from "./ArModal";
import type { Exhibit } from "@/lib/dummy-data/exhibits";

export function ExhibitViewer({ exhibit }: { exhibit: Exhibit }) {
  const [dark, setDark] = useState(false);
  const [arOpen, setArOpen] = useState(false);

  return (
    <div className={dark ? "min-h-screen bg-forest-900" : "min-h-screen bg-sage-50"}>
      <header className="flex items-center justify-between bg-forest-900 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8 text-white" />
          <div className="leading-tight">
            <p className="font-serif text-base font-semibold text-white">BioSphere</p>
            <p className="text-[11px] font-medium text-gold-500">USC Biological Museum</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-serif text-sm text-white/80 sm:inline">Online Exhibit</span>
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
          >
            {dark ? <SunIcon className="h-4.5 w-4.5" /> : <MoonIcon className="h-4.5 w-4.5" />}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pb-28 pt-4 sm:px-6">
        {exhibit.publicLayout === "card-grid" ? (
          <CardGridView exhibit={exhibit} dark={dark} />
        ) : (
          <AccordionView exhibit={exhibit} dark={dark} />
        )}
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 border-t px-4 py-3.5 sm:px-6 ${
          dark ? "border-white/10 bg-forest-900" : "border-black/10 bg-sage-50/95 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-2xl gap-3">
          <button
            type="button"
            onClick={() => setArOpen(true)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors ${
              dark ? "bg-emerald-400 text-emerald-950 hover:bg-emerald-300" : "bg-forest-800 text-white hover:bg-forest-900"
            }`}
          >
            <CubeIcon className="h-4 w-4" />
            View in AR
          </button>
          <a
            href="/gallery"
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-colors ${
              dark ? "border-white/30 text-white hover:bg-white/10" : "border-forest-800 text-forest-800 hover:bg-forest-100/60"
            }`}
          >
            Scan More
          </a>
        </div>
      </div>

      {arOpen && (
        <ArModal exhibit={exhibit} dark={dark} onClose={() => setArOpen(false)} />
      )}
    </div>
  );
}
