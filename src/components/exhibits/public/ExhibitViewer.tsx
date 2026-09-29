"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/layout/LogoMark";
import { MoonIcon, SunIcon, CubeIcon } from "@/components/icons";
import { detectArCapability, type ArCapability } from "@/features/exhibits-qr/ar-support";
import { exhibitLayout, type PublicExhibit } from "@/features/exhibits-qr/types";
import { CardGridView } from "./CardGridView";
import { AccordionView } from "./AccordionView";
import { ArModal } from "./ArModal";

export function ExhibitViewer({ exhibit }: { exhibit: PublicExhibit }) {
  const [dark, setDark] = useState(false);
  const [arOpen, setArOpen] = useState(false);
  // Unknown until checked in the browser, so the action never flashes on unsupported devices.
  const [capability, setCapability] = useState<ArCapability>("none");
  const name = exhibit.commonName ?? exhibit.scientificName ?? "Specimen";

  useEffect(() => {
    if (!exhibit.ar.available) return;
    let cancelled = false;
    detectArCapability(exhibit.ar.models)
      .then((result) => {
        if (!cancelled) setCapability(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [exhibit.ar]);

  return (
    <div className={dark ? "min-h-screen bg-forest-900" : "min-h-screen bg-sage-50"}>
      <header className="flex items-center justify-between bg-forest-900 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-9 w-9 shrink-0" />
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
            aria-pressed={dark}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
          >
            {dark ? <SunIcon className="h-4.5 w-4.5" /> : <MoonIcon className="h-4.5 w-4.5" />}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pb-28 pt-4 sm:px-6">
        {exhibitLayout(exhibit.layoutType) === "card-grid" ? (
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
          {capability !== "none" && (
            <button
              type="button"
              onClick={() => setArOpen(true)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors ${
                dark ? "bg-emerald-400 text-emerald-950 hover:bg-emerald-300" : "bg-forest-800 text-white hover:bg-forest-900"
              }`}
            >
              <CubeIcon className="h-4 w-4" />
              {capability === "ar" ? "View in AR" : "View in 3D"}
            </button>
          )}
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

      {arOpen && capability !== "none" && (
        <ArModal
          slug={exhibit.publicSlug}
          name={name}
          models={exhibit.ar.models}
          capability={capability}
          dark={dark}
          onClose={() => setArOpen(false)}
        />
      )}
    </div>
  );
}
