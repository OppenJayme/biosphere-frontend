/**
 * Cataloging revision-history URL and read-only presentation helpers.
 * This file validates filters, builds stable links and formats recorded evidence;
 * it never changes specimen data or decides catalog completeness.
 */

export const REVISION_PAGE_LIMIT = 25;

export type SpecimenRevisionQuery = {
  fieldChanged: string;
  sourceSection: string;
  page: number;
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function boundedText(value: string | undefined) {
  return (value ?? "").trim().slice(0, 100);
}

function parsePage(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return 1;

  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 && page <= 1_000_000 ? page : 1;
}

/** Allowlist and bound untrusted URL parameters before forwarding them to the API. */
export function parseSpecimenRevisionQuery(
  searchParams: SearchParams,
): SpecimenRevisionQuery {
  return {
    fieldChanged: boundedText(firstValue(searchParams.fieldChanged)),
    sourceSection: boundedText(firstValue(searchParams.sourceSection)),
    page: parsePage(firstValue(searchParams.page)),
  };
}

/** Preserve active filters while producing stable, shareable pagination links. */
export function specimenRevisionHistoryHref(
  specimenId: string,
  query: SpecimenRevisionQuery,
  page = query.page,
) {
  const params = new URLSearchParams();
  if (query.fieldChanged) params.set("fieldChanged", query.fieldChanged);
  if (query.sourceSection) params.set("sourceSection", query.sourceSection);
  if (page > 1) params.set("page", String(page));

  const base = `/specimens/${encodeURIComponent(specimenId)}/history`;
  const serialized = params.toString();
  return serialized ? `${base}?${serialized}` : base;
}

/** Format database-backed names for display without turning them into a frozen enum. */
export function revisionFieldLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/** Describe recorded media transitions without guessing unavailable historical filenames. */
export function revisionEventLabel(field: string, previous: string | null, next: string | null) {
  if (field === "specimen_media") {
    if (!previous && next) return "Image added";
    if (previous && !next) return "Image removed";
    return "Media record changed";
  }
  if (field === "specimen_media.file") return "Image file replaced";
  if (field === "specimen_media.cover") return "Cover image changed";
  if (field === "specimen_media.caption") return "Image caption changed";
  if (field === "specimen_media.display_order") return "Image display order changed";
  return revisionFieldLabel(field);
}

/** Presentation only: raw immutable IDs/paths stay in the protected API/database. */
export function revisionDisplayValue(
  value: string | null,
  field: string,
  side: "previous" | "new",
) {
  const present = value !== null && value.length > 0;
  if (field === "specimen_media") return present ? "Image recorded" : "No image record";
  if (field === "specimen_media.file") {
    return present
      ? side === "previous" ? "Previous image file" : "Replacement image file"
      : "No image file recorded";
  }
  if (field === "specimen_media.cover") {
    return present
      ? side === "previous" ? "Previously selected cover image" : "Selected cover image"
      : "No cover image selected";
  }
  if (present) return value;
  // Preserve the existing tag and ordinary-field empty-value behavior.
  if (field === "specimen_tags") {
    return side === "previous" ? "None (tag added)" : "None (tag removed)";
  }
  return "Not recorded";
}
