import Link from "next/link";
import { SearchIcon } from "@/components/icons";
import {
  hasAdvancedSpecimenFilters,
  SORT_DIRECTIONS,
  SPECIMEN_GENDERS,
  SPECIMEN_SORT_FIELDS,
  SPECIMEN_STATUSES,
  type MuseumCollection,
  type SpecimenListQuery,
} from "@/features/specimens/types";
import type { StoragePathOption } from "@/features/storage-locations/hierarchy";

const SORT_LABELS: Record<(typeof SPECIMEN_SORT_FIELDS)[number], string> = {
  updatedAt: "Last updated",
  createdAt: "Date created",
  accessionNumber: "Accession number",
  scientificName: "Scientific name",
  commonName: "Common name",
  status: "Catalog status",
  specimenCategory: "Category",
  family: "Family",
};

const TAXONOMY_FIELDS = [
  ["kingdom", "Kingdom"],
  ["phylum", "Phylum"],
  ["taxonClass", "Class"],
  ["taxonOrder", "Order"],
  ["family", "Family"],
  ["genus", "Genus"],
  ["species", "Species"],
] as const;

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
    hasAdvancedSpecimenFilters(query) ||
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
  storageOptions,
  storageLookupAvailable,
  filterError,
}: {
  query: SpecimenListQuery;
  collections: MuseumCollection[];
  collectionLookupAvailable: boolean;
  storageOptions: StoragePathOption[];
  storageLookupAvailable: boolean;
  filterError: string | null;
}) {
  const hasFilters = hasNonDefaultFilters(query);
  const advancedOpen = hasAdvancedSpecimenFilters(query);
  const selectedUnitMissing =
    Boolean(query.storageUnitId) && !storageOptions.some((option) => option.id === query.storageUnitId);
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
        <div className="flex flex-wrap gap-2">
          <Link
            href="/specimens/collections"
            className="rounded-lg border border-forest-700 px-4 py-2.5 text-sm font-semibold text-forest-800 hover:bg-forest-50"
          >
            Manage collections
          </Link>
          <Link
            href="/specimens/new"
            className="rounded-lg bg-forest-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
          >
            Add specimen draft
          </Link>
        </div>
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

        <details
          open={advancedOpen}
          className="rounded-lg border border-black/10 px-3 py-2 sm:col-span-2 xl:col-span-4"
        >
          <summary className="cursor-pointer text-xs font-semibold text-zinc-700">
            More filters: taxonomy, condition, storage location, tag, date added
          </summary>

          <div className="mt-3 grid grid-cols-1 gap-3 pb-1 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-medium text-zinc-600">
              Classification status
              <input
                name="classificationStatus"
                defaultValue={query.classificationStatus}
                maxLength={100}
                placeholder="e.g. Identified"
                className={controlClasses}
              />
            </label>

            <label className="text-xs font-medium text-zinc-600">
              Condition (active lot)
              <input
                name="conditionClass"
                defaultValue={query.conditionClass}
                maxLength={100}
                placeholder="e.g. Good"
                className={controlClasses}
              />
            </label>

            <label className="text-xs font-medium text-zinc-600">
              Tag
              <input
                name="tag"
                defaultValue={query.tag}
                maxLength={100}
                placeholder="Exact tag name"
                className={controlClasses}
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs font-medium text-zinc-600">
                Added from
                <input type="date" name="createdFrom" defaultValue={query.createdFrom} className={controlClasses} />
              </label>
              <label className="text-xs font-medium text-zinc-600">
                Added to
                <input type="date" name="createdTo" defaultValue={query.createdTo} className={controlClasses} />
              </label>
            </div>

            <label className="text-xs font-medium text-zinc-600 sm:col-span-2">
              Storage location (active lot)
              <select
                name="storageUnitId"
                defaultValue={query.storageUnitId ?? ""}
                disabled={!storageLookupAvailable}
                className={controlClasses}
              >
                <option value="">
                  {storageLookupAvailable ? "All locations" : "Location lookup unavailable"}
                </option>
                {selectedUnitMissing && query.storageUnitId && (
                  <option value={query.storageUnitId}>Selected location unavailable</option>
                )}
                {storageOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.pathLabel}
                    {option.archived ? " (archived)" : ""}
                  </option>
                ))}
              </select>
              {!storageLookupAvailable && query.storageUnitId && (
                <input type="hidden" name="storageUnitId" value={query.storageUnitId} />
              )}
            </label>

            <label className="text-xs font-medium text-zinc-600 sm:col-span-2">
              Units inside the location
              <select
                name="includeDescendantUnits"
                defaultValue={query.includeDescendantUnits === false ? "false" : "true"}
                className={controlClasses}
              >
                <option value="true">Include cabinets, drawers, and other units inside it</option>
                <option value="false">Only lots stored directly in it</option>
              </select>
            </label>

            {TAXONOMY_FIELDS.map(([name, label]) => (
              <label key={name} className="text-xs font-medium text-zinc-600">
                {label}
                <input
                  name={name}
                  defaultValue={query[name]}
                  maxLength={100}
                  placeholder="Exact name"
                  className={controlClasses}
                />
              </label>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            Text filters match the whole value, ignoring capital letters. Dates follow Philippine time.
          </p>
        </details>

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

      {filterError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {filterError}
        </p>
      )}

      {!storageLookupAvailable && (
        <p role="status" className="text-xs text-amber-800">
          Storage locations could not be loaded, so the location filter is unavailable.
        </p>
      )}

      {!collectionLookupAvailable && (
        <p role="status" className="text-xs text-amber-800">
          Collection choices could not be loaded. Other catalog filters remain available.
        </p>
      )}
    </div>
  );
}
