"use client";

import { CloseIcon, CubeIcon, InfoIcon } from "@/components/icons";
import type { Exhibit } from "@/lib/dummy-data/exhibits";

export function ArModal({
  exhibit,
  dark,
  onClose,
}: {
  exhibit: Exhibit;
  dark: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`w-full max-w-sm rounded-t-2xl p-5 sm:rounded-2xl ${dark ? "bg-forest-900 text-white" : "bg-white text-zinc-900"}`}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold">{exhibit.arEnabled ? "AR Viewer" : "AR Not Available Yet"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className={dark ? "text-white/60" : "text-zinc-400"}>
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {exhibit.arEnabled ? (
          <div className="mt-4 space-y-3">
            <div className="flex aspect-square items-center justify-center rounded-xl bg-black/30">
              <div className="text-center text-white/70">
                <CubeIcon className="mx-auto h-10 w-10 animate-pulse" />
                <p className="mt-2.5 text-xs">AR viewer would launch here on a supported device</p>
              </div>
            </div>
            <p className={`text-xs ${dark ? "text-white/60" : "text-zinc-500"}`}>
              Point your camera at a flat surface to place the {exhibit.commonName} model. Unsupported
              devices automatically fall back to this standard view.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <p className={`flex items-start gap-2 rounded-lg px-3.5 py-3 text-sm ${dark ? "bg-white/10" : "bg-sage-50"}`}>
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" />
              A WebAR model for this specimen hasn&apos;t been deployed yet. Explore everything about it
              below instead.
            </p>
            <button
              type="button"
              onClick={onClose}
              className={`w-full rounded-lg py-2.5 text-sm font-semibold ${dark ? "bg-emerald-400 text-emerald-950" : "bg-forest-800 text-white"}`}
            >
              Continue to Exhibit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
