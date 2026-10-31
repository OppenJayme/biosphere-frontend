import type { ReactNode } from "react";
import { ChevronDownIcon, FilterIcon } from "@/components/icons";

/** Button look for "More filters" controls, on a <summary> or a <button>. */
export const FILTER_TOGGLE_CLASSES =
  "inline-flex h-10 list-none items-center gap-2 rounded-lg border border-black/15 bg-white px-3.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-sage-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700 [&::-webkit-details-marker]:hidden";

/**
 * Icon, label and turning arrow. Inside <details className="group"> the arrow follows
 * the native open state; a plain <button> passes `open` instead.
 */
export function FilterToggleContent({ open, children }: { open?: boolean; children: ReactNode }) {
  return (
    <>
      <FilterIcon className="h-4 w-4 text-zinc-500" />
      {children}
      <ChevronDownIcon
        className={`h-4 w-4 text-zinc-400 transition-transform group-open:rotate-180 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
      />
    </>
  );
}
