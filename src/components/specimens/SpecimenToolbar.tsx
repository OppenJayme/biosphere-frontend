import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import {
  SORT_DIRECTIONS,
  SPECIMEN_GENDERS,
  SPECIMEN_SORT_FIELDS,
  SPECIMEN_STATUSES,
  type MuseumCollection,
  type SpecimenListQuery,
} from "@/features/specimens/types";

const SORT_LABELS: Record<(typeof SPECIMEN_SORT_FIELDS)[number], string> = {
  updatedAt: "Last updated",
  createdAt: "Date created",
  accessionNumber: "Accession number",
  scientificName: "Scientific name",
  commonName: "Common name",
  status: "Catalog status",
};

function enumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function hasNonDefaultFilters(query: SpecimenListQuery) {
  return (
    query.search.length > 0 ||
    query.status !== null ||
    query.collectionId !== null ||
    query.specimenCategory.length > 0 ||
    query.gender !== null ||
    query.publicDisplay !== null ||
    query.sortBy !== "updatedAt" ||
    query.sortDirection !== "desc"
  );
}

const controlClasses =
  "mt-1.5 w-full rounded-lg border border-black/15 bg-white px-3 py-2.5 text-sm text-zinc-800 focus:border-forest-700 focus:outline-none focus:ring-1 focus:ring-forest-700 disabled:bg-zinc-100 disabled:text-zinc-500";

export function SpecimenToolbar({
  query,
  collections,
  collectionLookupAvailable,
}: {
  query: SpecimenListQuery;
  collections: MuseumCollection[];
  collectionLookupAvailable: boolean;
}) {
  const hasFilters = hasNonDefaultFilters(query);
  const selectedCollectionMissing =
    query.collectionId !== null &&
    !collections.some((collection) => collection.id === query.collectionId);

  return (
    <div className="space-y-3 rounded-xl border border-black/10 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Catalog search and filters</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            All values are validated against the backend&apos;s approved query fields.
          </p>
        </div>
        <Link
          href="/specimens/new"
          className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
        >
          Add specimen draft
        </Link>
      </div>

      <form action="/specimens" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="relative sm:col-span-2 xl:col-span-2">
          <span className="text-xs font-medium text-zinc-600">Search</span>
          <SearchIcon className="pointer-events-none absolute bottom-3 left-3.5 h-4 w-4 text-zinc-400" />
          <input
            type="search"
            name="search"
            defaultValue={query.search}
            maxLength={100}
            placeholder="Identifiers, names, category, remarks, or collection"
            className={`${controlClasses} pl-10`}
          />
        </label>

        <label className="text-xs font-medium text-zinc-600">
          Catalog status
          <select name="status" defaultValue={query.status ?? ""} className={controlClasses}>
            <option value="">All statuses</option>
            {SPECIMEN_STATUSES.map((status) => (
              <option key={status} value={status}>{enumLabel(status)}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-zinc-600">
          Collection
          <select
            name="collectionId"
            defaultValue={query.collectionId ?? ""}
            disabled={!collectionLookupAvailable}
            className={controlClasses}
          >
            <option value="">
              {collectionLookupAvailable ? "All collections" : "Collection lookup unavailable"}
            </option>
            {selectedCollectionMissing && query.collectionId && (
              <option value={query.collectionId}>Selected collection unavailable</option>
            )}
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>{collection.collectionName}</option>
            ))}
          </select>
          {!collectionLookupAvailable && query.collectionId && (
            <input type="hidden" name="collectionId" value={query.collectionId} />
          )}
        </label>

        <label className="text-xs font-medium text-zinc-600">
          Specimen category
          <input
            name="specimenCategory"
            defaultValue={query.specimenCategory}
            maxLength={100}
            placeholder="Exact category"
            className={controlClasses}
          />
        </label>

        <label className="text-xs font-medium text-zinc-600">
          Gender
          <select name="gender" defaultValue={query.gender ?? ""} className={controlClasses}>
            <option value="">All genders</option>
            {SPECIMEN_GENDERS.map((gender) => (
              <option key={gender} value={gender}>{enumLabel(gender)}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-zinc-600">
          Public eligibility
          <select
            name="publicDisplay"
            defaultValue={query.publicDisplay === null ? "" : String(query.publicDisplay)}
            className={controlClasses}
          >
            <option value="">All eligibility states</option>
            <option value="true">Eligible</option>
            <option value="false">Not eligible</option>
          </select>
        </label>

        <label className="text-xs font-medium text-zinc-600">
          Sort by
          <select name="sortBy" defaultValue={query.sortBy} className={controlClasses}>
            {SPECIMEN_SORT_FIELDS.map((field) => (
              <option key={field} value={field}>{SORT_LABELS[field]}</option>
            ))}
          </select>
        </label>

        <label className="text-xs font-medium text-zinc-600">
          Sort direction
          <select
            name="sortDirection"
            defaultValue={query.sortDirection}
            className={controlClasses}
          >
            {SORT_DIRECTIONS.map((direction) => (
              <option key={direction} value={direction}>
                {direction === "asc" ? "Ascending" : "Descending"}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-3">
          <button
            type="submit"
            className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-800"
          >
            Apply filters
          </button>
          {hasFilters && (
            <Link
              href="/specimens"
              className="rounded-lg px-3 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50"
            >
              Clear all
            </Link>
          )}
        </div>
      </form>

      {!collectionLookupAvailable && (
        <p role="status" className="text-xs text-amber-800">
          Collection choices could not be loaded. Other catalog filters remain available.
        </p>
      )}
    </div>
  );
}
