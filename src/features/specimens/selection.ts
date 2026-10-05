/** URL-backed preview selection also works after reload or without hydration. */
import { specimenListHref, type SpecimenListQuery } from "./types";

export function selectedSpecimenId(
  raw: string | null,
  items: readonly { id: string }[],
): string | null {
  if (raw === null) return items[0]?.id ?? null;
  return items.some((item) => item.id === raw) ? raw : null;
}

export function specimenSelectionHref(query: SpecimenListQuery, id: string | null): string {
  const url = new URL(specimenListHref(query), "http://catalog.invalid");
  url.searchParams.set("selected", id ?? "none");
  return `${url.pathname}${url.search}#selected-specimen`;
}
