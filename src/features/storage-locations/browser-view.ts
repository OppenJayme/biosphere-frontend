/** Storage-page presentation only; never changes shared inventory or hierarchy records. */
import type { StorageUnit } from "./types";

export function storageBrowserView(
  units: StorageUnit[],
  options: { selectedId?: string; archived?: string } = {},
) {
  const requested = units.find(unit => unit.id === options.selectedId);
  // Old direct links remain usable; an explicit toggle always wins over auto-reveal.
  const showArchived = options.archived === "1" || (options.archived !== "0" && Boolean(requested?.archivedAt));
  const visibleUnits = showArchived ? units : units.filter(unit => !unit.archivedAt);
  const selected = visibleUnits.find(unit => unit.id === options.selectedId) ?? visibleUnits[0];
  const children = selected
    ? units.filter(unit => unit.parentId === selected.id)
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }) || a.id.localeCompare(b.id))
    : [];
  return {
    showArchived, visibleUnits, selected,
    activeChildren: children.filter(unit => !unit.archivedAt),
    archivedChildren: children.filter(unit => Boolean(unit.archivedAt)),
  };
}

/** Fixed internal route; selection and visibility survive reload and movement-history navigation. */
export function storageBrowserHref(selectedId: string | undefined, showArchived: boolean) {
  const query = new URLSearchParams({ archived: showArchived ? "1" : "0" });
  if (selectedId) query.set("selected", selectedId);
  return `/storage?${query}`;
}
