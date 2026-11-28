"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { InfoIcon } from "@/components/icons";

/**
 * A small (i) beside a heading that shows a short explanation, so a step's guidance is there when
 * wanted without adding lines to the form (panel feedback: too much text at once). It opens on
 * hover, keyboard focus or tap, and closes on Escape, blur, mouse leave or a tap outside. The text
 * stays in the DOM, linked with aria-describedby, so screen readers hear it with the button.
 */
export function InfoTip({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // A tap opens and pins it; hover alone closes it again when the pointer leaves.
  const [pinned, setPinned] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tipId = useId();

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    };
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, [open]);

  return (
    <span
      ref={wrapperRef}
      className="relative inline-flex align-middle"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!pinned) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label={label}
        aria-describedby={tipId}
        aria-expanded={open}
        onClick={() => {
          setOpen(!pinned);
          setPinned(!pinned);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setPinned(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            // Escape closes the tip, not the modal around it.
            event.stopPropagation();
            event.preventDefault();
            setOpen(false);
            setPinned(false);
          }
        }}
        className="rounded-full p-0.5 text-ink-muted transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
      >
        <InfoIcon className="h-[1.125rem] w-[1.125rem]" />
      </button>
      <span
        id={tipId}
        role="tooltip"
        className={`absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-lg bg-forest-900 px-3 py-2 text-left font-sans text-sm font-normal leading-snug tracking-normal text-white shadow-lg sm:left-0 sm:translate-x-0 ${
          open ? "" : "sr-only"
        }`}
      >
        {children}
      </span>
    </span>
  );
}
