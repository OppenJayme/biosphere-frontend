"use client";

import { useId, useState, type ReactNode } from "react";
import { InfoIcon } from "@/components/icons";

const ALIGN = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
} as const;

/**
 * Small "i" next to a label. The explanation opens on hover or keyboard focus,
 * stays open while the pointer is over it, and closes with Escape (WCAG 1.4.13).
 * Use it only for optional background; anything needed to finish a task stays visible.
 */
export function InfoTip({
  label,
  children,
  align = "center",
}: {
  /** What the tip explains, read by screen readers as "About <label>". */
  label: string;
  children: ReactNode;
  align?: keyof typeof ALIGN;
}) {
  const id = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const open = (hovered || focused) && !dismissed;

  return (
    <span
      className="relative inline-flex align-middle"
      onMouseEnter={() => {
        setDismissed(false);
        setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-describedby={open ? id : undefined}
        onFocus={() => {
          setDismissed(false);
          setFocused(true);
        }}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setDismissed(true);
        }}
        className="rounded-full p-0.5 text-zinc-400 hover:text-forest-700 focus-visible:text-forest-700 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-forest-600"
      >
        <InfoIcon className="h-4 w-4" />
      </button>
      <span
        id={id}
        role="tooltip"
        hidden={!open}
        className={`absolute top-full z-40 mt-1.5 w-64 rounded-lg bg-zinc-900 px-3 py-2 text-left font-sans text-xs leading-5 font-normal normal-case tracking-normal text-white shadow-lg ${ALIGN[align]}`}
      >
        {children}
      </span>
    </span>
  );
}
