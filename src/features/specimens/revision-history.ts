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
