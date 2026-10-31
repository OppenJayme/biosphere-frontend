import Link from "next/link";

export type FilterChip = {
  label: string;
  /** Shown after the label, e.g. "Pending 5". Omit when not known. */
  count?: number | null;
  active: boolean;
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

const BASE =
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700";
const ACTIVE = "border-forest-700 bg-forest-700 text-white";
const IDLE = "border-black/10 bg-white text-zinc-700 hover:border-forest-700/40 hover:bg-sage-50";

/**
 * A row of status filters that also shows how many records each holds, replacing
 * separate stat cards and a status dropdown with one control.
 */
export function FilterChips({ label, chips }: { label: string; chips: FilterChip[] }) {
  return (
    <nav aria-label={label} className="flex flex-wrap gap-2">
      {chips.map((chip) => {
        const content = (
          <>
            {chip.label}
            {chip.count !== undefined && chip.count !== null && (
              <span className={`tabular-nums ${chip.active ? "text-white/80" : "text-zinc-500"}`}>
                {chip.count.toLocaleString()}
              </span>
            )}
          </>
        );
        const className = `${BASE} ${chip.active ? ACTIVE : IDLE}`;
        return chip.href ? (
          <Link
            key={chip.label}
            href={chip.href}
            aria-current={chip.active ? "page" : undefined}
            className={className}
          >
            {content}
          </Link>
        ) : (
          <button
            key={chip.label}
            type="button"
            onClick={chip.onClick}
            aria-pressed={chip.active}
            className={className}
          >
            {content}
          </button>
        );
      })}
    </nav>
  );
}
